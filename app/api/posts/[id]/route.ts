export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { unlink, rename } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 100) || "untitled";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        media: true,
        captions: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, status, description } = body;

    const updateData: Record<string, string | null> = {};
    if (title !== undefined) updateData.title = title;
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;

    // If title changed, rename media files on disk too
    if (title !== undefined) {
      const existing = await prisma.post.findUnique({
        where: { id },
        include: { media: true },
      });

      if (existing) {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        const baseName = sanitizeFilename(title || "untitled");

        for (let i = 0; i < existing.media.length; i++) {
          const media = existing.media[i];
          const ext = media.filename.split(".").pop() || "";
          const suffix = existing.media.length > 1 ? `_${i + 1}` : "";
          let newFilename = `${baseName}${suffix}.${ext}`;

          // Avoid overwriting a different file
          let counter = 2;
          while (
            existsSync(path.join(uploadsDir, newFilename)) &&
            newFilename !== media.filename
          ) {
            newFilename = `${baseName}${suffix}_${counter}.${ext}`;
            counter++;
          }

          if (newFilename !== media.filename) {
            const oldPath = path.join(uploadsDir, media.filename);
            const newPath = path.join(uploadsDir, newFilename);
            if (existsSync(oldPath)) {
              await rename(oldPath, newPath);
            }
            await prisma.media.update({
              where: { id: media.id },
              data: { filename: newFilename, originalName: `${baseName}${suffix}.${ext}` },
            });
          }
        }
      }
    }

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        media: true,
        captions: true,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get media files to delete
    const post = await prisma.post.findUnique({
      where: { id },
      include: { media: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Delete media files from filesystem
    for (const media of post.media) {
      const filepath = path.join(process.cwd(), "public", "uploads", media.filename);
      if (existsSync(filepath)) {
        await unlink(filepath);
      }
    }

    // Delete post (cascades to media and captions)
    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
