"use client";

import UploadZone from "./UploadZone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt?: string;
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

interface MediaLibraryProps {
  posts: Post[];
  onUpload: (files: FileList) => void;
  onPostClick: (post: Post) => void;
  onDeletePost: (id: string) => void;
  isUploading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ready: "bg-green-500/20 text-green-400 border-green-500/30",
  posted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaLibrary({
  posts,
  onUpload,
  onPostClick,
  onDeletePost,
  isUploading,
}: MediaLibraryProps) {
  return (
    <div className="flex flex-col gap-6">
      <UploadZone onUpload={onUpload} isUploading={isUploading} />

      {posts.length > 0 && (
        <div>
          <h3 className="text-[var(--text-tertiary)] text-xs font-semibold uppercase tracking-wider mb-3">
            All Posts ({posts.length})
          </h3>
          <div className="flex flex-col gap-2">
            {posts.map((post) => {
              const firstMedia = post.media[0];
              const isVideo = firstMedia?.mimeType?.startsWith("video/");
              const mediaUrl = firstMedia
                ? firstMedia.filename.startsWith("http")
                  ? firstMedia.filename
                  : `/uploads/${firstMedia.filename}`
                : null;
              const captionCount = post.captions.filter(
                (c) => c.caption || c.hashtags
              ).length;

              return (
                <div
                  key={post.id}
                  className="flex items-center gap-4 p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-light)] transition-all group"
                >
                  {/* Thumbnail */}
                  <div
                    className="w-14 h-14 rounded-lg overflow-hidden shrink-0 cursor-pointer bg-[var(--bg-panel)] relative"
                    onClick={() => onPostClick(post)}
                  >
                    {mediaUrl ? (
                      isVideo ? (
                        <video
                          src={mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl}
                          alt={post.title || "Post"}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-[var(--text-faint)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPostClick(post)}>
                    <p className="text-[var(--text-primary)] text-sm font-medium truncate">
                      {post.title || firstMedia?.originalName || "Untitled"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {firstMedia && (
                        <span className="text-[var(--text-muted)] text-xs">
                          {formatFileSize(firstMedia.size)}
                        </span>
                      )}
                      {firstMedia && (
                        <span className="text-[var(--text-faint)] text-xs">•</span>
                      )}
                      <span className="text-[var(--text-muted)] text-xs">
                        {captionCount} platform{captionCount !== 1 ? "s" : ""} captioned
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-md border font-medium capitalize shrink-0",
                    STATUS_COLORS[post.status] || STATUS_COLORS.draft
                  )}>
                    {post.status}
                  </span>

                  {/* Media count */}
                  <span className="text-[var(--text-muted)] text-xs shrink-0">
                    {post.media.length} file{post.media.length !== 1 ? "s" : ""}
                  </span>

                  {/* Show in Finder */}
                  {firstMedia && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetch(`/api/media/reveal?filename=${encodeURIComponent(firstMedia.filename)}`);
                      }}
                      title="Show in Finder"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-[var(--hover-light)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this post and its media?")) {
                        onDeletePost(post.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
