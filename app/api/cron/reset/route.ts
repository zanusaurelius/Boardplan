export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete all visitor-uploaded posts (non-demo), cascading to their media and captions
  const deleted = await prisma.post.deleteMany({ where: { isDemo: false } });

  // Delete all visitor-generated captions on demo posts
  await prisma.caption.deleteMany({});

  // Reset all rate limit counters
  await prisma.rateLimit.deleteMany({});

  return NextResponse.json({ deleted: deleted.count });
}
