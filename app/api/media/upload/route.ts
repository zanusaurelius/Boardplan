export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveFile } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const createdPosts = [];
    const warnings: string[] = [];

    // Get current min order so new posts land at the top
    const minOrderPost = await prisma.post.findFirst({
      orderBy: { order: "asc" },
      select: { order: true },
    });
    let currentOrder = (minOrderPost?.order ?? 0) - files.length;

    for (const file of files) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/quicktime",
        "video/webm",
      ];

      if (!allowedTypes.includes(file.type)) {
        continue; // Skip invalid files
      }

      // Save file to filesystem
      const savedFile = await saveFile(file);

      // Video transcoding and transcription require ffmpeg which isn't
      // available on serverless — skip silently.
      const description = "";

      // Create post with media
      const post = await prisma.post.create({
        data: {
          title: file.name.replace(/\.[^.]+$/, ""),
          description,
          order: currentOrder++,
          media: {
            create: {
              filename: savedFile.filename,
              originalName: savedFile.originalName,
              mimeType: savedFile.mimeType,
              size: savedFile.size,
            },
          },
        },
        include: {
          media: true,
          captions: true,
        },
      });

      createdPosts.push(post);
    }

    return NextResponse.json({ posts: createdPosts, warnings }, { status: 201 });
  } catch (error) {
    console.error("Error uploading media:", error);
    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 }
    );
  }
}
