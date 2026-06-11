export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/sessionConfig";

export async function GET() {
  try {
    const cookieStore = await cookies();
    let sessionId = cookieStore.get(SESSION_COOKIE)?.value ?? "";
    const isNewSession = !sessionId;
    if (isNewSession) sessionId = uuidv4();

    const posts = await prisma.post.findMany({
      where: { OR: [{ isDemo: true }, { sessionId }] },
      orderBy: { order: "asc" },
      include: {
        media: true,
        captions: {
          where: { sessionId },
        },
      },
    });

    // Demo post descriptions are visitor-local (stored in browser); don't leak DB values
    const sanitized = posts.map((p) =>
      p.isDemo ? { ...p, description: "" } : p
    );

    const response = NextResponse.json(sanitized);
    if (isNewSession) {
      response.cookies.set(SESSION_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 48,
        path: "/",
      });
    }
    return response;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const body = await request.json();
    const { title } = body;

    const maxOrder = await prisma.post.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const post = await prisma.post.create({
      data: {
        title: title || null,
        order: (maxOrder?.order ?? -1) + 1,
        sessionId,
      },
      include: {
        media: true,
        captions: true,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
