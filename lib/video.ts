import { exec } from "child_process";
import { promisify } from "util";
import { renameSync, unlinkSync, existsSync } from "fs";

const execAsync = promisify(exec);

/**
 * Transcodes any video file to H.264 MP4 with AAC audio for browser compatibility.
 * Replaces the original file in-place. Returns the new filename with .mp4 extension.
 */
export async function transcodeToMp4(filePath: string, originalFilename: string): Promise<{ filename: string; mimeType: string }> {
  const mp4Path = filePath.replace(/\.[^.]+$/, ".mp4");
  const mp4Filename = originalFilename.replace(/\.[^.]+$/, ".mp4");

  await execAsync(
    `ffmpeg -i "${filePath}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart "${mp4Path}" -y`
  );

  // Replace original with transcoded version
  if (filePath !== mp4Path) {
    unlinkSync(filePath);
    // mp4Path is already written by ffmpeg
  }

  return { filename: mp4Filename, mimeType: "video/mp4" };
}

export function isVideoMimeType(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}
