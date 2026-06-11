export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionId } from "@/lib/session";

export async function PATCH(request: Request) {
  try {
    const sessionId = await getSessionId();
    const body = await request.json();
    const { orderedIds } = body as { orderedIds: string[] };

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds must be an array" },
        { status: 400 }
      );
    }

    // Only persist order for the visitor's own posts — demo post order is session-local
    // (stored in localStorage client-side so it never affects other visitors)
    // Neon HTTP adapter doesn't support transactions — run updates concurrently
    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.post.updateMany({
          where: { id, sessionId },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering posts:", error);
    return NextResponse.json(
      { error: "Failed to reorder posts" },
      { status: 500 }
    );
  }
}
