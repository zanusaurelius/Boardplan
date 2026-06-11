export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveFile } from "@/lib/storage";
import { analyzeImage } from "@/lib/claude";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const GLOBAL_ANALYZE_LIMIT = 50;
const GLOBAL_ANALYZE_WINDOW_MS = 24 * 60 * 60 * 1000;

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

      if (file.size > MAX_FILE_SIZE) {
        warnings.push(`"${file.name}" is too large — max upload size is 10 MB`);
        continue;
      }

      // Save file to filesystem
      const savedFile = await saveFile(file);

      // Analyze images with Claude vision to pre-fill the description.
      // Videos can't be analyzed — leave blank for the user to fill in.
      // Skip analysis if the global daily limit is exhausted (upload still succeeds).
      const isImage = file.type.startsWith("image/");
      let description = "";
      if (isImage) {
        const analyzeAllowed = await checkRateLimit(
          "global:analyze",
          GLOBAL_ANALYZE_LIMIT,
          GLOBAL_ANALYZE_WINDOW_MS
        );
        if (analyzeAllowed) {
          description = await analyzeImage(savedFile.filename);
        }
      }

      // Create post then media separately (HTTP mode doesn't support transactions)
      const post = await prisma.post.create({
        data: {
          title: file.name.replace(/\.[^.]+$/, ""),
          description,
          order: currentOrder++,
        },
      });

      const media = await prisma.media.create({
        data: {
          postId: post.id,
          filename: savedFile.filename,
          originalName: savedFile.originalName,
          mimeType: savedFile.mimeType,
          size: savedFile.size,
        },
      });

      createdPosts.push({ ...post, media: [media], captions: [] });
    }

    return NextResponse.json({ posts: createdPosts, warnings }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error uploading media:", message, error);
    return NextResponse.json(
      { error: "Failed to upload media", detail: message },
      { status: 500 }
    );
  }
}
