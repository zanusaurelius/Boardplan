export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionId } from "@/lib/session";
import { deleteFile } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = await getSessionId();

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        media: true,
        captions: { where: { sessionId } },
      },
    });

    if (!post || (!post.isDemo && post.sessionId !== sessionId)) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = await getSessionId();

    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Demo post edits are session-local — client stores them in localStorage.
    // Accept the request so the client state update succeeds, but don't write
    // to the shared DB row.
    if (post.isDemo) {
      return NextResponse.json({ ok: true });
    }

    if (post.sessionId !== sessionId) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, status, description } = body;

    const updateData: Record<string, string | null> = {};
    if (title !== undefined) updateData.title = title;
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;

    const updated = await prisma.post.update({
      where: { id },
      data: updateData,
      include: { media: true, captions: { where: { sessionId } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = await getSessionId();

    const post = await prisma.post.findUnique({
      where: { id },
      include: { media: true },
    });

    if (!post || post.isDemo || post.sessionId !== sessionId) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Delete blob files first, then the DB row (cascades to media + captions)
    await Promise.all(post.media.map((m) => deleteFile(m.filename)));
    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
