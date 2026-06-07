import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  if (!filename || filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const filepath = path.join(process.cwd(), "public", "uploads", filename);

  return new Promise<NextResponse>((resolve) => {
    execFile("open", ["-R", filepath], (err) => {
      if (err) {
        resolve(NextResponse.json({ error: "Failed to open Finder" }, { status: 500 }));
      } else {
        resolve(NextResponse.json({ ok: true }));
      }
    });
  });
}
