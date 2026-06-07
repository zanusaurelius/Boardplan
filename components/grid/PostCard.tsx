"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
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

interface PostCardProps {
  post: Post;
  aspectRatio: string;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onClick: (post: Post) => void;
  isDragging?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-500 text-white border-yellow-600",
  ready: "bg-green-500 text-white border-green-600",
  posted: "bg-blue-500 text-white border-blue-600",
};

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸",
  tiktok: "🎵",
  youtube: "▶️",
  facebook: "👥",
  snapchat: "👻",
  twitter: "𝕏",
  pinterest: "📌",
};

export default function PostCard({
  post,
  aspectRatio,
  isSelected,
  onSelect,
  onClick,
  isDragging = false,
}: PostCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [checkboxHovered, setCheckboxHovered] = useState(false);

  const firstMedia = post.media[0];
  const isVideo = firstMedia?.mimeType?.startsWith("video/");
  const mediaUrl = firstMedia ? `/uploads/${firstMedia.filename}` : null;

  const platformsWithCaptions = post.captions
    .filter((c) => c.caption || c.hashtags)
    .map((c) => c.platform);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (isVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(post.id, !isSelected);
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200",
        "bg-[var(--bg-card)] border",
        isSelected
          ? "ring-2 ring-violet-500 border-violet-500/50"
          : post.status === "posted"
          ? "border-blue-500/50 ring-1 ring-blue-500/30"
          : post.status === "ready"
          ? "border-green-500/50 ring-1 ring-green-500/30"
          : "border-[var(--border-subtle)]",
        isDragging && "opacity-50 scale-95",
        post.status === "posted" && !isDragging && "opacity-50",
        post.status === "posted" ? "cursor-default" : (!isDragging && "hover:border-[var(--border-light)] hover:shadow-lg hover:shadow-black/30")
      )}
      style={{ aspectRatio }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onClick(post)}
    >
      {/* Media */}
      {mediaUrl ? (
        isVideo ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            className="w-full h-full object-cover"
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl}
            alt={post.title || "Post"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[var(--bg-raised)]">
          <svg className="w-8 h-8 text-[var(--text-faint)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Video play icon */}
      {isVideo && !isHovered && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Overlay gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-200",
        isHovered ? "opacity-100" : "opacity-0"
      )} />

      {/* Checkbox */}
      <div
        className={cn(
          "absolute top-2 left-2 transition-all duration-150 z-10",
          (isHovered || isSelected) ? "opacity-100" : "opacity-0"
        )}
        onClick={handleCheckboxClick}
        onMouseEnter={() => setCheckboxHovered(true)}
        onMouseLeave={() => setCheckboxHovered(false)}
      >
        <div className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
          isSelected
            ? "bg-violet-600 border-violet-600"
            : checkboxHovered
            ? "border-white bg-white/10"
            : "border-white/60 bg-black/30"
        )}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Posted lock icon */}
      {post.status === "posted" && (
        <div className="absolute bottom-2 right-2 z-10 w-6 h-6 rounded-full bg-blue-500/80 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a5 5 0 00-5 5v3H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V11a2 2 0 00-2-2h-2V6a5 5 0 00-5-5zm0 2a3 3 0 013 3v3H9V6a3 3 0 013-3zm0 9a2 2 0 110 4 2 2 0 010-4z"/>
          </svg>
        </div>
      )}

      {/* Status badge */}
      <div className="absolute top-2 right-2 z-10">
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-md border font-semibold capitalize shadow-sm",
          STATUS_COLORS[post.status] || STATUS_COLORS.draft
        )}>
          {post.status}
        </span>
      </div>

      {/* Bottom info */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 p-2 transition-opacity duration-200",
        isHovered ? "opacity-100" : "opacity-0"
      )}>
        {post.title && (
          <p className="text-[var(--text-primary)] text-xs font-medium truncate mb-1">{post.title}</p>
        )}
        {platformsWithCaptions.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {platformsWithCaptions.map((p) => (
              <span key={p} className="text-xs" title={p}>
                {PLATFORM_ICONS[p]}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
