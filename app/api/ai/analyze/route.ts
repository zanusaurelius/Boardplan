export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { analyzeImage } from "@/lib/claude";
import { checkRateLimit } from "@/lib/rateLimit";

const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;
const GLOBAL_LIMIT = 50;
const GLOBAL_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
      headersList.get("x-real-ip") ??
      "unknown";

    const globalAllowed = await checkRateLimit("global:analyze", GLOBAL_LIMIT, GLOBAL_WINDOW_MS);
    if (!globalAllowed) {
      return NextResponse.json(
        { error: "This demo has hit its daily analysis limit — check back tomorrow!" },
        { status: 429 }
      );
    }

    const allowed = await checkRateLimit(`analyze:${ip}`, LIMIT, WINDOW_MS);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in an hour." },
        { status: 429 }
      );
    }

    const { postId } = await request.json();
    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { media: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const firstMedia = post.media[0];
    if (!firstMedia) {
      return NextResponse.json({ error: "No media attached to this post" }, { status: 400 });
    }

    if (!firstMedia.mimeType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Video analysis isn't supported — describe the content manually." },
        { status: 400 }
      );
    }

    const imageUrl = firstMedia.filename.startsWith("http")
      ? firstMedia.filename
      : `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/${firstMedia.filename}`;

    const description = await analyzeImage(imageUrl);
    if (!description) {
      return NextResponse.json(
        { error: "Analysis returned empty — check ANTHROPIC_API_KEY" },
        { status: 500 }
      );
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: { description },
    });

    return NextResponse.json({ description: updated.description });
  } catch (error) {
    console.error("Analyze route error:", error);
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 });
  }
}
