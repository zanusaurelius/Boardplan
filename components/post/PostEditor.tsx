"use client";

import { useState, useRef, useEffect } from "react";
import { FaInstagram, FaFacebook, FaYoutube, FaPinterest } from "react-icons/fa";
import { FaTiktok, FaXTwitter, FaSnapchat } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import CaptionEditor from "./CaptionEditor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface PostEditorProps {
  post: Post | null;
  posts: Post[];
  onNavigate: (post: Post) => void;
  onClose: () => void;
  onSaveCaption: (
    postId: string,
    platform: string,
    title: string,
    caption: string,
    hashtags: string
  ) => Promise<void>;
  onUpdateStatus: (postId: string, status: string) => Promise<void>;
  onGenerateAI: (postId: string, platform: string, tone: CaptionTone) => Promise<void>;
  onGenerateAllPlatforms: (postId: string, tone: CaptionTone) => Promise<void>;
  generatingPlatforms: Set<string>;
  onRenamePost?: (postId: string, title: string) => Promise<void>;
  onSaveDescription?: (postId: string, description: string) => Promise<void>;
  onAnalyzeComplete?: (postId: string, description: string) => void;
  onDeletePost?: (postId: string) => Promise<void>;
}

const PLATFORMS = [
  { id: "instagram", label: "Instagram",   Icon: FaInstagram, color: "text-pink-400" },
  { id: "tiktok",    label: "TikTok",      Icon: FaTiktok,    color: "text-[var(--text-primary)]" },
  { id: "youtube",   label: "YouTube",     Icon: FaYoutube,   color: "text-red-400" },
  { id: "facebook",  label: "Facebook",    Icon: FaFacebook,  color: "text-blue-400" },
  { id: "snapchat",  label: "Snapchat",    Icon: FaSnapchat,  color: "text-yellow-400" },
  { id: "twitter",   label: "Twitter / X", Icon: FaXTwitter,  color: "text-[var(--text-primary)]" },
  { id: "pinterest", label: "Pinterest",   Icon: FaPinterest, color: "text-red-400" },
];

export default function PostEditor({
  post,
  posts,
  onNavigate,
  onClose,
  onSaveCaption,
  onUpdateStatus,
  onGenerateAI,
  onGenerateAllPlatforms,
  generatingPlatforms,
  onRenamePost,
  onSaveDescription,
  onAnalyzeComplete,
  onDeletePost,
}: PostEditorProps) {
  const [activePlatform, setActivePlatform] = useState("instagram");
  const [tone, setTone] = useState<CaptionTone>("funny");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const currentIndex = post ? posts.findIndex((p) => p.id === post.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < posts.length - 1;

  useEffect(() => {
    if (post) {
      setActivePlatform("instagram");
      setIsEditingTitle(false);
    }
  }, [post?.id]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Arrow key navigation — skip when user is typing in an input/textarea
  useEffect(() => {
    if (!post) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(posts[currentIndex - 1]);
      if (e.key === "ArrowRight" && hasNext) onNavigate(posts[currentIndex + 1]);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [post, currentIndex, hasPrev, hasNext, posts, onNavigate, onClose]);

  const handleTitleEdit = () => {
    setTitleDraft(post?.title || post?.media[0]?.originalName || "");
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (!post || !onRenamePost) return;
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === (post.title || post.media[0]?.originalName)) {
      setIsEditingTitle(false);
      return;
    }
    setIsRenaming(true);
    await onRenamePost(post.id, trimmed);
    setIsEditingTitle(false);
    setIsRenaming(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTitleSave();
    if (e.key === "Escape") setIsEditingTitle(false);
  };

  if (!post) return null;

  const isLocked = post.status === "ready" || post.status === "posted";
  const firstMedia = post.media[0];
  const isVideo = firstMedia?.mimeType?.startsWith("video/");
  const mediaUrl = firstMedia
    ? firstMedia.filename.startsWith("http")
      ? firstMedia.filename
      : `/uploads/${firstMedia.filename}`
    : null;

  const getCaption = (platform: string) =>
    post.captions.find((c) => c.platform === platform);

  const handleAnalyzeImage = async () => {
    if (!post || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      onAnalyzeComplete?.(post.id, data.description);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!post.description?.trim()) {
      toast.error("Add a description first — click \"Analyze image\" or write one yourself.");
      return;
    }
    setIsGeneratingAll(true);
    await onGenerateAllPlatforms(post.id, tone);
    setIsGeneratingAll(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel - slides in from right */}
      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[720px] bg-[var(--bg-panel)] border-l border-[var(--border-subtle)] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-3 border-b border-[var(--border-subtle)] shrink-0">
          {/* Row 1: Nav + Actions */}
          <div className="flex items-center">
            {/* Prev/Next nav */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => hasPrev && onNavigate(posts[currentIndex - 1])}
                disabled={!hasPrev}
                title="Previous post (←)"
                className="p-1.5 rounded-lg hover:bg-[var(--hover-light)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-[var(--text-faint)] text-xs tabular-nums">
                {currentIndex + 1}/{posts.length}
              </span>
              <button
                onClick={() => hasNext && onNavigate(posts[currentIndex + 1])}
                disabled={!hasNext}
                title="Next post (→)"
                className="p-1.5 rounded-lg hover:bg-[var(--hover-light)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Title inline on sm+ */}
            <div className="hidden sm:block flex-1 min-w-0 mx-3">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={titleInputRef}
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={handleTitleSave}
                    disabled={isRenaming}
                    className="flex-1 bg-[var(--bg-raised)] border border-violet-500/60 rounded-md px-2 py-1 text-[var(--text-primary)] text-sm font-semibold outline-none min-w-0"
                  />
                  {isRenaming && (
                    <span className="text-[var(--text-muted)] text-xs shrink-0">Renaming…</span>
                  )}
                </div>
              ) : (
                <button
                  onClick={isLocked ? undefined : handleTitleEdit}
                  title={isLocked ? undefined : "Click to rename"}
                  className={cn("group flex items-center gap-1.5 max-w-full text-left", isLocked && "cursor-default")}
                >
                  <h2 className="text-[var(--text-primary)] font-semibold text-base truncate group-hover:text-violet-300 transition-colors">
                    {post.title || firstMedia?.originalName || "Edit Post"}
                  </h2>
                  {!isLocked && (
                    <svg className="w-3.5 h-3.5 text-[var(--text-faint)] group-hover:text-violet-400 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  )}
                </button>
              )}
              <p className="text-[var(--text-muted)] text-xs mt-0.5">
                {post.media.length} file{post.media.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex-1 sm:hidden" />

            <div className="flex items-center gap-2">
              {onDeletePost && post.status !== "posted" && (
                <button
                  onClick={async () => {
                    if (!confirm("Delete this post?")) return;
                    await onDeletePost(post.id);
                    onClose();
                  }}
                  title="Delete post"
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <Select
                value={post.status}
                onValueChange={(val) => val && onUpdateStatus(post.id, val)}
              >
                <SelectTrigger className="h-8 w-24 bg-[var(--bg-card)] border-[var(--border-light)] text-[var(--text-primary)] text-xs capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-card)] border-[var(--border-light)]">
                  <SelectItem value="draft" className="text-yellow-400 text-xs">Draft</SelectItem>
                  <SelectItem value="ready" className="text-green-400 text-xs">Ready</SelectItem>
                  <SelectItem value="posted" className="text-blue-400 text-xs">Posted</SelectItem>
                </SelectContent>
              </Select>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[var(--hover-light)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Row 2: Title — mobile only, full width */}
          <div className="sm:hidden mt-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  ref={titleInputRef}
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  onBlur={handleTitleSave}
                  disabled={isRenaming}
                  className="flex-1 bg-[var(--bg-raised)] border border-violet-500/60 rounded-md px-2 py-1 text-[var(--text-primary)] text-sm font-semibold outline-none min-w-0"
                />
                {isRenaming && (
                  <span className="text-[var(--text-muted)] text-xs shrink-0">Renaming…</span>
                )}
              </div>
            ) : (
              <button
                onClick={isLocked ? undefined : handleTitleEdit}
                title={isLocked ? undefined : "Click to rename"}
                className={cn("group flex items-center gap-1.5 w-full text-left", isLocked && "cursor-default")}
              >
                <h2 className="text-[var(--text-primary)] font-semibold text-base truncate group-hover:text-violet-300 transition-colors">
                  {post.title || firstMedia?.originalName || "Edit Post"}
                </h2>
                {!isLocked && (
                  <svg className="w-3.5 h-3.5 text-[var(--text-faint)] group-hover:text-violet-400 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                )}
              </button>
            )}
            <p className="text-[var(--text-muted)] text-xs mt-0.5">
              {post.media.length} file{post.media.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 flex flex-col gap-5">
            {/* Locked banner */}
            {isLocked && (
              <div className="flex items-center gap-2.5 bg-[var(--bg-raised)] border border-[var(--border-light)] rounded-lg px-4 py-3">
                <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-[var(--text-muted)] text-sm">
                  This post is <span className="text-[var(--text-secondary)] font-medium capitalize">{post.status}</span> and cannot be edited. Change the status to <span className="text-[var(--text-secondary)] font-medium">Draft</span> to make changes.
                </p>
              </div>
            )}

            {/* Media preview */}
            {mediaUrl && (
              <div className="flex flex-col gap-2">
                <div className="rounded-xl overflow-hidden bg-[var(--bg-base)]">
                  {isVideo ? (
                    <video
                      ref={videoRef}
                      src={mediaUrl}
                      className="w-full max-h-64 object-contain"
                      controls
                      loop
                      playsInline
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl}
                      alt={post.title || "Post"}
                      className="w-full max-h-64 object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Multiple media indicator */}
            {post.media.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {post.media.slice(1).map((m) => (
                  <div key={m.id} className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-[var(--bg-base)]">
                    {m.mimeType.startsWith("video/") ? (
                      <video
                        src={m.filename.startsWith("http") ? m.filename : `/uploads/${m.filename}`}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.filename.startsWith("http") ? m.filename : `/uploads/${m.filename}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Description / transcript for AI */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
                  Description / Transcript
                </label>
                {!isLocked && !isVideo && (
                  <button
                    onClick={handleAnalyzeImage}
                    disabled={isAnalyzing}
                    className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 disabled:opacity-50 transition-colors"
                  >
                    {isAnalyzing ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Analyze image
                      </>
                    )}
                  </button>
                )}
              </div>
              <textarea
                key={post.description}
                defaultValue={post.description || ""}
                onBlur={(e) => !isLocked && onSaveDescription?.(post.id, e.target.value)}
                placeholder={isVideo ? "Describe what happens in this video — Claude will use this to write captions." : "Click \"Analyze image\" to auto-fill, or describe the photo yourself."}
                rows={4}
                disabled={isLocked}
                className={cn(
                  "w-full bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-faint)] resize-none focus:outline-none focus:border-violet-500/60 transition-colors",
                  isLocked && "opacity-60 cursor-not-allowed"
                )}
              />
            </div>

            {/* Tone selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
                Tone
              </label>
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

            {/* Generate buttons */}
            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                onClick={handleGenerateAll}
                disabled={isGeneratingAll || generatingPlatforms.size > 0}
              >
                {isGeneratingAll ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating All Platforms...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate All Platforms
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full border-violet-600/30 text-violet-400 hover:bg-violet-600/10 hover:border-violet-500/50 bg-transparent"
                onClick={() => {
                  if (!post.description?.trim()) {
                    toast.error("Add a description first — click \"Analyze image\" or write one yourself.");
                    return;
                  }
                  onGenerateAI(post.id, activePlatform, tone);
                }}
                disabled={generatingPlatforms.has(activePlatform) || isGeneratingAll}
              >
                {generatingPlatforms.has(activePlatform) ? (
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
                    Generate for {PLATFORMS.find(p => p.id === activePlatform)?.label ?? activePlatform}
                  </>
                )}
              </Button>
            </div>

            {/* Platform tabs */}
            <div>
              <div className="flex flex-wrap gap-1 mb-4">
                {PLATFORMS.map((p) => {
                  const cap = getCaption(p.id);
                  const hasCaption = cap?.caption || cap?.hashtags;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActivePlatform(p.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 relative",
                        activePlatform === p.id
                          ? "bg-violet-600 text-white"
                          : "bg-[var(--bg-card)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)]"
                      )}
                    >
                      <p.Icon className={cn("w-3.5 h-3.5", activePlatform === p.id ? "text-white" : p.color)} />
                      <span>{p.label}</span>
                      {hasCaption && activePlatform !== p.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 absolute top-1 right-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              <CaptionEditor
                key={`${post.id}-${activePlatform}`}
                platform={activePlatform}
                caption={getCaption(activePlatform)}
                postId={post.id}
                onSave={(platform, title, caption, hashtags) =>
                  onSaveCaption(post.id, platform, title, caption, hashtags)
                }
                onGenerateAI={(platform) => onGenerateAI(post.id, platform, tone)}
                isGenerating={
                  generatingPlatforms.has(activePlatform) || isGeneratingAll
                }
                isLocked={isLocked}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
