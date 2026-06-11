"use client";

import { useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { type Platform } from "./Sidebar";

interface TopBarProps {
  platform: Platform;
  view: "grid" | "library";
  selectedCount: number;
  onUpload: (files: FileList) => void;
  onGenerateCaptions: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onUpdateSelectedStatus: (status: string) => void;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube Shorts",
  facebook: "Facebook",
  snapchat: "Snapchat",
  twitter: "Twitter / X",
  pinterest: "Pinterest",
};

const STATUS_OPTIONS = [
  { value: "draft",  label: "Draft",  activeClass: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" },
  { value: "ready",  label: "Ready",  activeClass: "bg-green-500/20 text-green-400 border-green-500/40" },
  { value: "posted", label: "Posted", activeClass: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
];

export default function TopBar({
  platform,
  view,
  selectedCount,
  onUpload,
  onGenerateCaptions,
  onClearSelection,
  onDeleteSelected,
  onUpdateSelectedStatus,
}: TopBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <header className="h-14 bg-[var(--bg-panel)] border-b border-[var(--border-subtle)] flex items-center px-6 gap-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <Image src="/logo.png" alt="Boardplan" width={28} height={28} className="rounded-lg" />
        <span className="font-bold text-[var(--text-primary)] text-lg tracking-tight">boardplan</span>
      </div>

      <div className="h-5 w-px bg-[var(--border-light)]" />
      <span className="text-[var(--text-muted)] text-sm">
        {view === "grid" ? PLATFORM_LABELS[platform] : "Media Library"}
      </span>

      <div className="flex-1" />

      {/* Selection bar */}
      {selectedCount > 0 && (
        <div className="flex items-center h-9 bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-full shadow-md divide-x divide-[var(--border-light)] overflow-hidden">
          {/* Count */}
          <span className="text-[var(--text-muted)] text-xs font-medium px-4 whitespace-nowrap">
            {selectedCount} selected
          </span>

          {/* Status pills */}
          <div className="flex items-center gap-1 px-3">
            <button
              onClick={() => onUpdateSelectedStatus("draft")}
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
            >
              Draft
            </button>
            <button
              onClick={() => onUpdateSelectedStatus("ready")}
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-500/15 text-green-400 hover:bg-green-500/30 transition-colors"
            >
              Ready
            </button>
            <button
              onClick={() => onUpdateSelectedStatus("posted")}
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              Posted
            </button>
          </div>

          {/* Generate */}
          <button
            onClick={onGenerateCaptions}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-subtle)] transition-colors px-4 h-full"
          >
            <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate
          </button>

          {/* Delete */}
          <button
            onClick={onDeleteSelected}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors px-4 h-full"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>

          {/* Clear */}
          <button
            onClick={onClearSelection}
            className="flex items-center justify-center w-9 h-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-subtle)] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload button */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        size="sm"
        className="bg-violet-600 hover:bg-violet-700 text-white border-0 h-8"
        onClick={() => fileInputRef.current?.click()}
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Upload
      </Button>
    </header>
  );
}
