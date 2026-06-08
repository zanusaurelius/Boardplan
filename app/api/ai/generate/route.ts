import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { generateCaption } from "@/lib/claude";

const RATE_LIMIT = 20;        // max requests
const WINDOW_MS = 60 * 60 * 1000; // per hour

async function checkRateLimit(ip: string): Promise<boolean> {
  const now = new Date();

  const record = await prisma.rateLimit.upsert({
    where: { ip },
    create: { ip, count: 1, windowStart: now },
    update: {
      count: { increment: 1 },
      windowStart: now, // overwritten below if window is still active
    },
  });

  // If the window has expired, reset it
  const windowAge = now.getTime() - record.windowStart.getTime();
  if (windowAge > WINDOW_MS) {
    await prisma.rateLimit.update({
      where: { ip },
      data: { count: 1, windowStart: now },
    });
    return true;
  }

  return record.count <= RATE_LIMIT;
}

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
      headersList.get("x-real-ip") ??
      "unknown";

    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      postIds,
      platforms,
      descriptions,
    }: {
      postIds: string[];
      platforms: string[];
      descriptions?: Record<string, string>;
    } = body;

    if (!postIds || !platforms || postIds.length === 0 || platforms.length === 0) {
      return NextResponse.json(
        { error: "postIds and platforms are required" },
        { status: 400 }
      );
    }

    const results: Record<string, Record<string, { title: string; caption: string; hashtags: string }>> = {};

    for (const postId of postIds) {
      results[postId] = {};
      const description = descriptions?.[postId] || "No description provided.";

      for (const platform of platforms) {
        try {
          const generated = await generateCaption(platform, description);

          await prisma.caption.upsert({
            where: { postId_platform: { postId, platform } },
            update: { title: generated.title, caption: generated.caption, hashtags: generated.hashtags },
            create: { postId, platform, title: generated.title, caption: generated.caption, hashtags: generated.hashtags },
          });

          results[postId][platform] = generated;
        } catch (err) {
          console.error(`Error generating caption for post ${postId}, platform ${platform}:`, err);
          results[postId][platform] = { title: "", caption: "", hashtags: "" };
        }
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error in AI generate route:", error);
    return NextResponse.json({ error: "Failed to generate captions" }, { status: 500 });
  }
}
