import { put, del } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";

export async function saveFile(file: File): Promise<{
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}> {
  const ext = file.name.split(".").pop() || "";
  const filename = `${uuidv4()}.${ext}`;

  const blob = await put(filename, file, { access: "public" });

  return {
    filename: blob.url,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

export async function deleteFile(url: string): Promise<void> {
  if (!url.startsWith("http")) return; // legacy local path — nothing to do
  await del(url);
}

export function getPublicUrl(filename: string): string {
  // Support both legacy local paths and Vercel Blob URLs
  if (filename.startsWith("http")) return filename;
  return `/uploads/${filename}`;
}
