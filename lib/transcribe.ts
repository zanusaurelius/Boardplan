import { exec } from "child_process";
import { promisify } from "util";
import { createReadStream, unlinkSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import OpenAI from "openai";

const execAsync = promisify(exec);

export async function transcribeVideo(videoPath: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const tmpAudio = join(tmpdir(), `bp_audio_${Date.now()}.mp3`);

  try {
    // Extract audio with ffmpeg
    await execAsync(
      `ffmpeg -i "${videoPath}" -vn -ar 16000 -ac 1 -b:a 64k "${tmpAudio}" -y`
    );

    // Send to Whisper
    const openai = new OpenAI({ apiKey });
    const response = await openai.audio.transcriptions.create({
      file: createReadStream(tmpAudio),
      model: "whisper-1",
    });

    return response.text;
  } finally {
    if (existsSync(tmpAudio)) unlinkSync(tmpAudio);
  }
}
