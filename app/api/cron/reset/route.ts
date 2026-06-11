export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteFile } from "@/lib/storage";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch media URLs before deleting DB rows so blobs can be cleaned up
  const postsToDelete = await prisma.post.findMany({
    where: { isDemo: false },
    include: { media: true },
  });

  const mediaUrls = postsToDelete.flatMap((p) => p.media.map((m) => m.filename));
  await Promise.all(mediaUrls.map(deleteFile));

  // Delete visitor posts (cascades to media + captions rows)
  const deleted = await prisma.post.deleteMany({ where: { isDemo: false } });

  // Delete visitor captions on demo posts (not covered by post cascade)
  await prisma.caption.deleteMany({});

  // Reset rate limit counters
  await prisma.rateLimit.deleteMany({});

  return NextResponse.json({ deleted: deleted.count });
}
