import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { order: "asc" },
      include: {
        media: true,
        captions: true,
      },
    });
    return NextResponse.json(posts);
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
    const body = await request.json();
    const { title, mediaIds } = body;

    // Get the max order
    const maxOrder = await prisma.post.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const post = await prisma.post.create({
      data: {
        title: title || null,
        order: (maxOrder?.order ?? -1) + 1,
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
