import Anthropic from "@anthropic-ai/sdk";

export interface GeneratedCaption {
  title: string;    // YouTube, Pinterest only
  caption: string;  // main text / combined text
  hashtags: string; // Instagram only (comma-separated)
}

export type CaptionTone = "funny" | "casual" | "professional" | "inspirational" | "educational";

const BASE_SYSTEM_PROMPT = `You are an expert social media marketer who specializes in creating high-performing, platform-native content. You understand what drives engagement, virality, and audience growth across all major platforms. You tailor tone, format, length, and hashtag strategy specifically for each platform's culture and algorithm. You write content that feels authentic — never corporate or generic.`;

const TONE_INSTRUCTIONS: Record<CaptionTone, string> = {
  funny:         "Be funny, witty, and playful. Content should make the audience laugh or smile. Use humor that feels natural — avoid forced jokes and mean-spirited humor.",
  casual:        "Be authentic and conversational — like texting a friend. Relaxed, warm, natural. No corporate polish, no forced humor. Just real talk.",
  professional:  "Be polished and brand-appropriate. Clear, credible, confident. No slang, minimal emojis. Lead with value and keep it tight.",
  inspirational: "Be uplifting and aspirational. Lead with feeling or a moment of awe, end with something that makes the reader want to act or believe. Storytelling-first.",
  educational:   "Be informative and useful. Teach something specific about what's in the content. Use accessible language, build credibility, and invite discussion.",
};

function buildSystemPrompt(tone: CaptionTone): string {
  return `${BASE_SYSTEM_PROMPT} ${TONE_INSTRUCTIONS[tone]}`;
}

// Platform-specific instructions — combined with shared system prompt
const PLATFORM_PROMPTS: Record<string, string> = {
  instagram: `Write an Instagram caption and hashtag list based on the content description or transcript below.
- Caption: authentic, conversational, use emojis where natural, max 2200 chars
- Hashtags: exactly 5–10 relevant hashtags, comma-separated, no # symbol
Return ONLY this JSON: {"title": "", "caption": "...", "hashtags": "tag1,tag2,tag3"}`,

  tiktok: `Write a TikTok caption based on the content description or transcript below.
- Open with a hook that references something SPECIFIC from the actual content — a moment, a quote, or a detail. Never generic.
- 2–3 punchy lines total, under 300 chars including hashtags
- End with 4–6 hashtags: mix content-specific niche tags with 1–2 broad reach tags like #fyp
- Tone: funny, energetic, native to TikTok — use trending formats (POV, "tell me why", "nobody:", etc.) where natural
- Put the caption lines and hashtags together in the caption field, separated with a blank line
Return ONLY valid JSON (escape all newlines as \\n): {"title": "", "caption": "caption text\\n\\n#tag1 #tag2 #tag3", "hashtags": ""}`,

  youtube: `Write a YouTube Shorts title and description based on the content description or transcript below.
- Title: reference what ACTUALLY HAPPENS in the video — specific, curious, or funny. Make someone stop scrolling. Max 100 chars. No hashtags in the title. No generic clickbait like "You won't believe" or "Watch until the end".
- Description: 2–3 sentences with personality that describe what the video is actually about. Make the viewer want to comment. End with 3–4 hashtags — include content-specific niche tags, not just #Shorts.
Return ONLY valid JSON (escape all newlines as \\n): {"title": "...", "caption": "description text\\n\\n#tag1 #tag2 #tag3", "hashtags": ""}`,

  facebook: `Write a Facebook post based on the content description or transcript below.
- Conversational and personal, encourage comments or shares
- Include 2–5 relevant hashtags naturally inline or at the end
Return ONLY this JSON: {"title": "", "caption": "post text #tag1 #tag2", "hashtags": ""}`,

  twitter: `Write a tweet based on the content description or transcript below.
- Punchy, direct, under 280 characters total including hashtags
- Include 1–2 hashtags inline
Return ONLY this JSON: {"title": "", "caption": "tweet text #tag1", "hashtags": ""}`,

  snapchat: `Write a Snapchat caption based on the content description or transcript below.
- Super short: 1–2 sentences max
- Fun, casual, use emojis — no hashtags needed
Return ONLY this JSON: {"title": "", "caption": "short fun caption ✨", "hashtags": ""}`,

  pinterest: `Write a Pinterest pin title and description based on the content description or transcript below.
- Title: keyword-rich and specific to what's actually in the content — not generic. Max 100 chars.
- Description: 2–3 sentences that describe what the content IS, not vague inspiration-speak. Include 3–5 relevant niche hashtags at the end.
Return ONLY valid JSON (escape all newlines as \\n): {"title": "...", "caption": "description text\\n\\n#tag1 #tag2", "hashtags": ""}`,
};

const MOCK_CAPTIONS: Record<string, GeneratedCaption> = {
  instagram: {
    title: "",
    caption: "Living for these moments ✨ Every frame tells a story. Drop a ❤️ if this resonates!",
    hashtags: "photography,lifestyle,content,creator,aesthetic",
  },
  tiktok: {
    title: "",
    caption: "POV: you finally captured that perfect shot 🎬✨\n\n#fyp #viral #content",
    hashtags: "",
  },
  youtube: {
    title: "You Won't Believe What Happened Next",
    caption: "Watch until the end — this one is worth it. Like and subscribe for more content like this!\n\n#YouTubeShorts #Shorts",
    hashtags: "",
  },
  facebook: {
    title: "",
    caption: "Had to share this with all of you! Some moments are too good to keep to yourself. What do you think? 😊 #moments #life",
    hashtags: "",
  },
  twitter: {
    title: "",
    caption: "Some moments just hit different. No caption needed, but here we are. 📸 #content",
    hashtags: "",
  },
  snapchat: {
    title: "",
    caption: "This moment right here 🔥✨",
    hashtags: "",
  },
  pinterest: {
    title: "Inspiration Worth Saving",
    caption: "Capturing the beauty in everyday moments. Save this for your mood board and let it inspire your next creative project.\n\n#inspiration #aesthetic #moodboard",
    hashtags: "",
  },
};

export async function analyzeImage(imageUrl: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your_key_here") return "";

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "url", url: imageUrl } },
            {
              type: "text",
              text: "Describe what's in this image in 2–3 sentences. Focus on the subject, setting, mood, and any notable visual details. Write it as a scene description — not a list. This will be used as context for generating social media captions.",
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    return content.type === "text" ? content.text.trim() : "";
  } catch (error) {
    console.error("Image analysis error:", error);
    return "";
  }
}

export async function generateCaption(
  platform: string,
  description: string,
  tone: CaptionTone = "funny"
): Promise<GeneratedCaption> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "your_key_here") {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_CAPTIONS[platform] || MOCK_CAPTIONS.instagram;
  }

  const client = new Anthropic({ apiKey });
  const platformPrompt = PLATFORM_PROMPTS[platform] || PLATFORM_PROMPTS.instagram;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: buildSystemPrompt(tone),
      messages: [
        {
          role: "user",
          content: `${platformPrompt}\n\nContent description / transcript:\n${description}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title: parsed.title || "",
      caption: parsed.caption || "",
      hashtags: parsed.hashtags || "",
    };
  } catch (error) {
    console.error("Claude API error:", error);
    return MOCK_CAPTIONS[platform] || MOCK_CAPTIONS.instagram;
  }
}
