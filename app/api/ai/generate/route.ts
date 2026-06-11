export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { generateCaption, type CaptionTone } from "@/lib/claude";
import { checkRateLimit } from "@/lib/rateLimit";
import { getSessionId } from "@/lib/session";

const LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000;
const GLOBAL_LIMIT = 100;
const GLOBAL_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
      headersList.get("x-real-ip") ??
      "unknown";

    const globalAllowed = await checkRateLimit("global:generate", GLOBAL_LIMIT, GLOBAL_WINDOW_MS);
    if (!globalAllowed) {
      return NextResponse.json(
        { error: "This demo has hit its daily generation limit — check back tomorrow!" },
        { status: 429 }
      );
    }

    const allowed = await checkRateLimit(`generate:${ip}`, LIMIT, WINDOW_MS);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in an hour." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      postIds,
      platforms,
      descriptions,
      tone,
    }: {
      postIds: string[];
      platforms: string[];
      descriptions?: Record<string, string>;
      tone?: CaptionTone;
    } = body;

    if (!postIds || !platforms || postIds.length === 0 || platforms.length === 0) {
      return NextResponse.json(
        { error: "postIds and platforms are required" },
        { status: 400 }
      );
    }

    const sessionId = await getSessionId();
    const results: Record<string, Record<string, { title: string; caption: string; hashtags: string }>> = {};

    for (const postId of postIds) {
      results[postId] = {};
      const description = descriptions?.[postId] || "No description provided.";

      for (const platform of platforms) {
        try {
          const generated = await generateCaption(platform, description, tone ?? "funny");

          await prisma.caption.upsert({
            where: { postId_platform_sessionId: { postId, platform, sessionId } },
            update: { title: generated.title, caption: generated.caption, hashtags: generated.hashtags },
            create: { postId, platform, sessionId, title: generated.title, caption: generated.caption, hashtags: generated.hashtags },
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
