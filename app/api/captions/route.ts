export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, platform, title, caption, hashtags } = body;

    if (!postId || !platform) {
      return NextResponse.json({ error: "postId and platform are required" }, { status: 400 });
    }

    const result = await prisma.caption.upsert({
      where: { postId_platform: { postId, platform } },
      update: {
        title: title ?? "",
        caption: caption ?? "",
        hashtags: hashtags ?? "",
      },
      create: {
        postId,
        platform,
        title: title ?? "",
        caption: caption ?? "",
        hashtags: hashtags ?? "",
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error upserting caption:", error);
    return NextResponse.json({ error: "Failed to save caption" }, { status: 500 });
  }
}
