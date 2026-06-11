"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { CaptionTone } from "@/lib/claude";

interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

interface Caption {
  id: string;
  platform: string;
  title: string;
  caption: string;
  hashtags: string;
}

interface Post {
  id: string;
  isDemo: boolean;
  title: string | null;
  description: string;
  status: string;
  order: number;
  media: Media[];
  captions: Caption[];
}

interface BulkGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPosts: Post[];
  onGenerate: (postIds: string[], platforms: string[]) => Promise<void>;
}

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "youtube", label: "YouTube", icon: "▶️" },
  { id: "facebook", label: "Facebook", icon: "👥" },
  { id: "snapchat", label: "Snapchat", icon: "👻" },
  { id: "twitter", label: "Twitter / X", icon: "𝕏" },
  { id: "pinterest", label: "Pinterest", icon: "📌" },
];

export default function BulkGenerateModal({
  isOpen,
  onClose,
  selectedPosts,
  onGenerate,
}: BulkGenerateModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(["instagram", "tiktok", "youtube"])
  );
  const [tone, setTone] = useState<CaptionTone>("funny");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState("");

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedPlatforms(new Set(PLATFORMS.map((p) => p.id)));
  const selectNone = () => setSelectedPlatforms(new Set());

  const handleGenerate = async () => {
    if (selectedPlatforms.size === 0 || selectedPosts.length === 0) return;

    setIsGenerating(true);
    setProgress(0);

    const platforms = Array.from(selectedPlatforms);
    const total = selectedPosts.length;
    let done = 0;

    try {
      const batchSize = 3;
      for (let i = 0; i < selectedPosts.length; i += batchSize) {
        const batch = selectedPosts.slice(i, i + batchSize);
        setCurrentItem(`Generating for ${batch[0].title || "post"} (${i + 1}/${selectedPosts.length})...`);

        const descriptions: Record<string, string> = {};
        for (const post of batch) {
          descriptions[post.id] = post.description || "";
        }

        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postIds: batch.map((p) => p.id), platforms, descriptions, tone }),
        });

        if (!response.ok) throw new Error("Generation failed");

        done += batch.length;
        setProgress(Math.round((done / total) * 100));
      }

      await onGenerate(selectedPosts.map((p) => p.id), platforms);
      setCurrentItem("Done!");

      setTimeout(() => {
        onClose();
        setIsGenerating(false);
        setProgress(0);
        setCurrentItem("");
      }, 1000);
    } catch (error) {
      console.error("Bulk generation error:", error);
      setIsGenerating(false);
      setCurrentItem("Generation failed. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[var(--bg-panel)] border-[var(--border-light)] text-[var(--text-primary)] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)]">
            Generate Captions with AI
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Post count */}
          <div className="bg-[var(--bg-card)] rounded-lg px-4 py-3 border border-[var(--border-subtle)]">
            <p className="text-[var(--text-secondary)] text-sm">
              Generating captions for{" "}
              <span className="text-[var(--text-primary)] font-semibold">
                {selectedPosts.length} post{selectedPosts.length !== 1 ? "s" : ""}
              </span>
            </p>
          </div>

          {/* Tone selector */}
          <div>
            <p className="text-[var(--text-tertiary)] text-xs font-semibold uppercase tracking-wider mb-2">
              Tone
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(["funny", "casual", "professional", "inspirational", "educational"] as CaptionTone[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all",
                    tone === t
                      ? "bg-violet-600 text-white"
                      : "bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-light)]"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Platform selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[var(--text-tertiary)] text-xs font-semibold uppercase tracking-wider">
                Select Platforms
              </p>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  All
                </button>
                <span className="text-[var(--text-faint)]">·</span>
                <button
                  onClick={selectNone}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  None
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all",
                    selectedPlatforms.has(p.id)
                      ? "bg-violet-600/20 border-violet-600/40 text-white"
                      : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-light)]"
                  )}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                  {selectedPlatforms.has(p.id) && (
                    <svg className="w-3.5 h-3.5 text-violet-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="flex flex-col gap-2">
              <Progress value={progress} className="h-1.5 bg-white/10" />
              <p className="text-[var(--text-muted)] text-xs text-center">{currentItem}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-[var(--border-light)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--hover-subtle)] hover:text-[var(--text-primary)]"
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white border-0"
              onClick={handleGenerate}
              disabled={
                isGenerating ||
                selectedPlatforms.size === 0 ||
                selectedPosts.length === 0
              }
            >
              {isGenerating ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate ({selectedPlatforms.size} platform{selectedPlatforms.size !== 1 ? "s" : ""})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
