import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export async function ensureUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true });
  }
}

export async function saveFile(file: File): Promise<{
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}> {
  await ensureUploadsDir();

  const ext = file.name.split(".").pop() || "";
  const filename = `${uuidv4()}.${ext}`;
  const filepath = path.join(UPLOADS_DIR, filename);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filepath, buffer);

  return {
    filename,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

export function getPublicUrl(filename: string): string {
  return `/uploads/${filename}`;
}
