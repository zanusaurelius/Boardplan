"use client";

import DraggableGrid from "./DraggableGrid";
import { type Platform } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

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
  title: string | null;
  description: string;
  status: string;
  order: number;
  media: Media[];
  captions: Caption[];
}

interface PlatformConfig {
  columns: number;
  aspectRatio: string;
  label: string;
}

const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  instagram: { columns: 3, aspectRatio: "4/5", label: "Instagram" },
  tiktok: { columns: 3, aspectRatio: "9/16", label: "TikTok" },
  youtube: { columns: 3, aspectRatio: "9/16", label: "YouTube Shorts" },
  facebook: { columns: 3, aspectRatio: "1/1", label: "Facebook" },
  snapchat: { columns: 3, aspectRatio: "9/16", label: "Snapchat" },
  twitter: { columns: 3, aspectRatio: "1/1", label: "Twitter / X" },
  pinterest: { columns: 3, aspectRatio: "2/3", label: "Pinterest" },
};

interface PlatformGridProps {
  platform: Platform;
  posts: Post[];
  selectedIds: Set<string>;
  onSelect: (id: string, selected: boolean) => void;
  onPostClick: (post: Post) => void;
  onReorder: (orderedIds: string[]) => void;
}

export default function PlatformGrid({
  platform,
  posts,
  selectedIds,
  onSelect,
  onPostClick,
  onReorder,
}: PlatformGridProps) {
  const config = PLATFORM_CONFIGS[platform];

  // Max grid widths: Instagram/TikTok/FB/Snap/Twitter/Pinterest = 3 cols ~720px, YouTube = 2 cols ~640px
  const maxWidth = config.columns === 2 ? "max-w-2xl" : "max-w-3xl";

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-[var(--text-muted)] py-24">
        <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-lg font-medium mb-2">No content yet</p>
        <p className="text-sm">Upload photos or videos to get started</p>
      </div>
    );
  }

  return (
    <div className={maxWidth}>
      <DraggableGrid
        posts={posts}
        columns={config.columns}
        aspectRatio={config.aspectRatio}
        selectedIds={selectedIds}
        onSelect={onSelect}
        onPostClick={onPostClick}
        onReorder={onReorder}
      />
    </div>
  );
}
