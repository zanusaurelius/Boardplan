import { NextResponse } from "next/server";
import { join } from "path";
import { prisma } from "@/lib/db";
import { saveFile } from "@/lib/storage";
import { transcribeVideo } from "@/lib/transcribe";
import { transcodeToMp4, isVideoMimeType } from "@/lib/video";

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

      // Transcode videos to H.264 MP4 for browser compatibility
      if (isVideoMimeType(savedFile.mimeType)) {
        try {
          const originalPath = join(process.cwd(), "public", "uploads", savedFile.filename);
          const transcoded = await transcodeToMp4(originalPath, savedFile.filename);
          savedFile.filename = transcoded.filename;
          savedFile.mimeType = transcoded.mimeType;
        } catch (err) {
          console.error("Transcode failed:", err);
          warnings.push(`Video transcoding failed for "${file.name}" — original format kept, playback may not work in all browsers`);
        }
      }

      // Auto-transcribe videos
      let description = "";
      if (isVideoMimeType(savedFile.mimeType)) {
        try {
          const videoPath = join(process.cwd(), "public", "uploads", savedFile.filename);
          description = await transcribeVideo(videoPath);
        } catch (err) {
          console.error("Transcription failed:", err);
          warnings.push(`Auto-transcription failed for "${file.name}" — add a description manually to improve AI captions`);
        }
      }

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
