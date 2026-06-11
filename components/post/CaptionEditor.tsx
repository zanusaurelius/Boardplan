"use client";

import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Caption {
  id: string;
  platform: string;
  title: string;
  caption: string;
  hashtags: string;
}

interface CaptionEditorProps {
  platform: string;
  caption: Caption | undefined;
  postId: string;
  onSave: (platform: string, title: string, caption: string, hashtags: string) => Promise<void>;
  onGenerateAI: (platform: string) => Promise<void>;
  isGenerating?: boolean;
  isLocked?: boolean;
}

// Layout types
type Layout = "caption-hashtags" | "combined" | "title-description";

const PLATFORM_CONFIG: Record<string, {
  layout: Layout;
  captionLabel: string;
  captionPlaceholder: string;
  captionMaxChars?: number;
  hashtagsPlaceholder?: string;
  hashtagCount?: string;
  titlePlaceholder?: string;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
}> = {
  instagram: {
    layout: "caption-hashtags",
    captionLabel: "Caption",
    captionPlaceholder: "Write an engaging caption...",
    captionMaxChars: 2200,
    hashtagsPlaceholder: "photography, lifestyle, content (5-10 hashtags, comma-separated)",
    hashtagCount: "5-10 hashtags",
  },
  tiktok: {
    layout: "combined",
    captionLabel: "Caption + Hashtags",
    captionPlaceholder: "Write a punchy caption...\n\n#fyp #viral #trending",
    captionMaxChars: 300,
  },
  youtube: {
    layout: "title-description",
    captionLabel: "Description",
    captionPlaceholder: "Write an engaging description...\n\n#Shorts #YouTube",
    titlePlaceholder: "Write a catchy title (max 100 chars)...",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Write an engaging description...\n\n#Shorts #YouTube",
  },
  facebook: {
    layout: "combined",
    captionLabel: "Post",
    captionPlaceholder: "Write a conversational post... #hashtag",
  },
  twitter: {
    layout: "combined",
    captionLabel: "Tweet",
    captionPlaceholder: "Write a punchy tweet... #tag",
    captionMaxChars: 280,
  },
  snapchat: {
    layout: "combined",
    captionLabel: "Caption",
    captionPlaceholder: "Short and fun ✨",
  },
  pinterest: {
    layout: "title-description",
    captionLabel: "Description",
    captionPlaceholder: "Describe your pin...\n\n#inspiration #aesthetic",
    titlePlaceholder: "Write a clear, keyword-rich title...",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Describe your pin...\n\n#inspiration #aesthetic",
  },
};

function formatHashtags(raw: string | undefined): string {
  if (!raw) return "";
  return raw.split(",").map((t) => t.trim()).filter(Boolean).join(", ");
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1 rounded hover:bg-[var(--hover-subtle)]"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

export default function CaptionEditor({
  platform,
  caption,
  postId,
  onSave,
  onGenerateAI,
  isGenerating,
  isLocked,
}: CaptionEditorProps) {
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.instagram;

  const [titleText, setTitleText] = useState(caption?.title || "");
  const [captionText, setCaptionText] = useState(caption?.caption || "");
  const [hashtagsText, setHashtagsText] = useState(formatHashtags(caption?.hashtags));
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTitleText(caption?.title || "");
    setCaptionText(caption?.caption || "");
    setHashtagsText(formatHashtags(caption?.hashtags));
  }, [caption?.title, caption?.caption, caption?.hashtags]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const scheduleAutoSave = (newTitle: string, newCaption: string, newHashtags: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      await onSave(platform, newTitle, newCaption, newHashtags);
      setIsSaving(false);
      setSavedAt(new Date());
    }, 800);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 100);
    setTitleText(val);
    scheduleAutoSave(val, captionText, hashtagsText);
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = config.captionMaxChars ? e.target.value.slice(0, config.captionMaxChars) : e.target.value;
    setCaptionText(val);
    scheduleAutoSave(titleText, val, hashtagsText);
  };

  const handleHashtagsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHashtagsText(e.target.value);
    scheduleAutoSave(titleText, captionText, e.target.value);
  };

  const charCount = captionText.length;
  const maxChars = config.captionMaxChars;
  const isNearLimit = maxChars && charCount > maxChars * 0.9;
  const isAtLimit = maxChars && charCount >= maxChars;

  const hashtags = hashtagsText.split(",").map((t) => t.trim()).filter(Boolean);

  const SaveStatus = () => (
    <span className="text-[var(--text-faint)] text-xs">
      {isSaving ? "Saving..." : savedAt ? "Saved" : ""}
    </span>
  );

  const GenerateButton = () => (
    <Button
      size="sm"
      variant="outline"
      className="w-full border-violet-600/30 text-violet-400 hover:bg-violet-600/10 hover:border-violet-500/50 bg-transparent"
      onClick={() => onGenerateAI(platform)}
      disabled={isGenerating || isLocked}
    >
      {isGenerating ? (
        <>
          <svg className="w-3.5 h-3.5 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generating...
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generate with AI
        </>
      )}
    </Button>
  );

  // ── Instagram: separate caption + hashtags ──────────────────────────────
  if (config.layout === "caption-hashtags") {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[var(--text-tertiary)] text-xs font-medium uppercase tracking-wider">Caption</label>
            <div className="flex items-center gap-2">
              <SaveStatus />
              {maxChars && (
                <span className={cn("text-xs tabular-nums", isAtLimit ? "text-red-400" : isNearLimit ? "text-yellow-400" : "text-[var(--text-muted)]")}>
                  {charCount}/{maxChars}
                </span>
              )}
              <CopyButton text={captionText} />
            </div>
          </div>
          <Textarea
            value={captionText}
            onChange={handleCaptionChange}
            placeholder={config.captionPlaceholder}
            disabled={isLocked}
            className={cn("bg-[var(--bg-input)] border-[var(--border-light)] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] resize-none focus:border-violet-500/50 focus:ring-0 text-sm min-h-[200px]", isLocked && "opacity-60 cursor-not-allowed")}
            rows={8}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[var(--text-tertiary)] text-xs font-medium uppercase tracking-wider">
              Hashtags <span className="text-[var(--text-faint)] normal-case font-normal">{config.hashtagCount}</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)] text-xs">{hashtags.length} tags</span>
              <CopyButton text={hashtags.map(t => `#${t}`).join(" ")} />
            </div>
          </div>
          <Textarea
            value={hashtagsText}
            onChange={handleHashtagsChange}
            placeholder={config.hashtagsPlaceholder}
            disabled={isLocked}
            className={cn("bg-[var(--bg-input)] border-[var(--border-light)] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] resize-none focus:border-violet-500/50 focus:ring-0 text-sm min-h-[90px]", isLocked && "opacity-60 cursor-not-allowed")}
            rows={3}
          />
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {hashtags.map((tag, i) => (
                <span key={i} className="text-xs bg-violet-600/10 text-violet-400 border border-violet-600/20 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── TikTok / Facebook / Twitter / Snapchat: one combined box ───────────
  if (config.layout === "combined") {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[var(--text-tertiary)] text-xs font-medium uppercase tracking-wider">{config.captionLabel}</label>
            <div className="flex items-center gap-2">
              <SaveStatus />
              {maxChars && (
                <span className={cn("text-xs tabular-nums", isAtLimit ? "text-red-400" : isNearLimit ? "text-yellow-400" : "text-[var(--text-muted)]")}>
                  {charCount}/{maxChars}
                </span>
              )}
              <CopyButton text={captionText} />
            </div>
          </div>
          <Textarea
            value={captionText}
            onChange={handleCaptionChange}
            placeholder={config.captionPlaceholder}
            disabled={isLocked}
            className={cn("bg-[var(--bg-input)] border-[var(--border-light)] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] resize-none focus:border-violet-500/50 focus:ring-0 text-sm min-h-[220px]", isLocked && "opacity-60 cursor-not-allowed")}
            rows={9}
          />
        </div>
      </div>
    );
  }

  // ── YouTube / Pinterest: title + description ────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[var(--text-tertiary)] text-xs font-medium uppercase tracking-wider">Title</label>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs tabular-nums", titleText.length > 90 ? "text-yellow-400" : "text-[var(--text-muted)]")}>
              {titleText.length}/100
            </span>
            <CopyButton text={titleText} />
          </div>
        </div>
        <input
          type="text"
          value={titleText}
          onChange={handleTitleChange}
          placeholder={config.titlePlaceholder}
          disabled={isLocked}
          className={cn("w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-md px-3 py-2 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-faint)] focus:outline-none focus:border-violet-500/50", isLocked && "opacity-60 cursor-not-allowed")}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[var(--text-tertiary)] text-xs font-medium uppercase tracking-wider">
            {config.descriptionLabel || "Description"}
          </label>
          <div className="flex items-center gap-2">
            <SaveStatus />
            <CopyButton text={captionText} />
          </div>
        </div>
        <Textarea
          value={captionText}
          onChange={handleCaptionChange}
          placeholder={config.descriptionPlaceholder}
          disabled={isLocked}
          className={cn("bg-[var(--bg-input)] border-[var(--border-light)] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] resize-none focus:border-violet-500/50 focus:ring-0 text-sm min-h-[120px]", isLocked && "opacity-60 cursor-not-allowed")}
          rows={5}
        />
      </div>
    </div>
  );
}
