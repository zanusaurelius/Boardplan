export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderedIds } = body as { orderedIds: string[] };

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds must be an array" },
        { status: 400 }
      );
    }

    // Neon HTTP adapter doesn't support transactions — run updates concurrently
    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.post.update({
          where: { id },
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
