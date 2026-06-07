import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCaption } from "@/lib/claude";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      postIds,
      platforms,
      descriptions,
    }: {
      postIds: string[];
      platforms: string[];
      descriptions?: Record<string, string>; // postId -> description text
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
