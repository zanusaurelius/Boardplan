"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Sidebar, { type Platform } from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import PlatformGrid from "@/components/grid/PlatformGrid";
import MediaLibrary from "@/components/library/MediaLibrary";
import PostEditor from "@/components/post/PostEditor";
import BulkGenerateModal from "@/components/post/BulkGenerateModal";
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
  title: string | null;
  description: string;
  status: string;
  order: number;
  media: Media[];
  captions: Caption[];
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activePlatform, setActivePlatform] = useState<Platform>("instagram");
  const [view, setView] = useState<"grid" | "library">("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatingPlatforms, setGeneratingPlatforms] = useState<Set<string>>(
    new Set()
  );
  const [isDragOverPage, setIsDragOverPage] = useState(false);
  const dragCounterRef = useRef(0);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPosts(data);
    } catch {
      toast.error("Failed to load posts");
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Global drag-over-page detection
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      dragCounterRef.current += 1;
      setIsDragOverPage(true);
    };
    const handleDragLeave = () => {
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDragOverPage(false);
      }
    };
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragOverPage(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle file upload
  const handleUpload = async (files: FileList) => {
    setIsUploading(true);
    const toastId = toast.loading(`Uploading ${files.length} file(s)...`);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Upload failed");
      }
      const data = await res.json();

      setPosts((prev) => [...data.posts, ...prev]);
      toast.success(`Uploaded ${data.posts.length} post(s)!`, { id: toastId });
      if (data.warnings?.length) {
        for (const warning of data.warnings) {
          toast.warning(warning);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle post selection
  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Handle reorder
  const handleReorder = async (orderedIds: string[]) => {
    // Optimistic update
    const reordered = orderedIds
      .map((id) => posts.find((p) => p.id === id))
      .filter((p): p is Post => !!p);
    setPosts(reordered);

    try {
      const res = await fetch("/api/posts/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error("Reorder failed");
    } catch {
      toast.error("Failed to save order");
      fetchPosts();
    }
  };

  // Handle caption save
  const handleSaveCaption = async (
    postId: string,
    platform: string,
    title: string,
    caption: string,
    hashtags: string
  ) => {
    try {
      const res = await fetch("/api/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, platform, title, caption, hashtags }),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();

      // Update post in state
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const existingCaptions = p.captions.filter(
            (c) => c.platform !== platform
          );
          return { ...p, captions: [...existingCaptions, updated] };
        })
      );

      // Update editing post if open
      if (editingPost?.id === postId) {
        setEditingPost((prev) => {
          if (!prev) return prev;
          const existingCaptions = prev.captions.filter(
            (c) => c.platform !== platform
          );
          return { ...prev, captions: [...existingCaptions, updated] };
        });
      }
    } catch {
      toast.error("Failed to save caption");
    }
  };

  // Handle description save (manual edits via textarea blur)
  const handleSaveDescription = async (postId: string, description: string) => {
    // Update local state immediately so the UI reflects the change
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, description } : p));
    setEditingPost((prev) => prev?.id === postId ? { ...prev, description } : prev);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error("Save failed");
    } catch {
      toast.error("Failed to save description");
    }
  };

  // Handle analyze complete — DB already updated by the API; just sync local state
  const handleAnalyzeComplete = (postId: string, description: string) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, description } : p));
    setEditingPost((prev) => prev?.id === postId ? { ...prev, description } : prev);
  };

  // Handle rename (updates title + renames file on disk)
  const handleRenamePost = async (postId: string, title: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Rename failed");
      const updated = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      if (editingPost?.id === postId) setEditingPost(updated);
      toast.success("Renamed successfully");
    } catch {
      toast.error("Failed to rename");
    }
  };

  // Handle status update — auto-moves to oldest slot when posted
  const handleUpdateStatus = async (postId: string, status: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();

      if (status === "posted") {
        const nonPosted = posts.filter((p) => p.id !== postId && p.status !== "posted");
        const alreadyPosted = posts.filter((p) => p.id !== postId && p.status === "posted");
        const newOrder = [...nonPosted, updated, ...alreadyPosted];
        setPosts(newOrder);
        try {
          const reorderRes = await fetch("/api/posts/reorder", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderedIds: newOrder.map((p) => p.id) }),
          });
          if (!reorderRes.ok) throw new Error("Reorder failed");
        } catch {
          toast.error("Failed to save post order");
          fetchPosts();
        }
      } else {
        setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      }

      if (editingPost?.id === postId) setEditingPost(updated);
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Bulk status update for selected posts
  const handleBulkStatusUpdate = async (status: string) => {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => handleUpdateStatus(id, status)));
    clearSelection();
  };

  // Handle delete
  const handleDeletePost = async (id: string) => {
    const post = posts.find((p) => p.id === id);
    if (post?.status === "posted") {
      toast.error("Move to Draft or Ready before deleting");
      return;
    }
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      setPosts((prev) => prev.filter((p) => p.id !== id));
      if (editingPost?.id === id) setEditingPost(null);
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    const deletable = posts.filter((p) => selectedIds.has(p.id) && p.status !== "posted");
    const blocked = selectedIds.size - deletable.length;

    if (deletable.length === 0) {
      toast.error("Posted posts cannot be deleted — move them to Draft or Ready first");
      return;
    }
    if (!confirm(`Delete ${deletable.length} post(s)?${blocked > 0 ? ` (${blocked} posted post(s) will be skipped)` : ""}`)) return;

    const deleteResults = await Promise.all(
      deletable.map(async (p) => {
        const res = await fetch(`/api/posts/${p.id}`, { method: "DELETE" });
        return { id: p.id, ok: res.ok };
      })
    );
    const deletedIds = new Set(deleteResults.filter((r) => r.ok).map((r) => r.id));
    const failedCount = deleteResults.length - deletedIds.size;
    setPosts((prev) => prev.filter((p) => !deletedIds.has(p.id)));
    clearSelection();
    if (failedCount > 0) {
      toast.error(`Deleted ${deletedIds.size} post(s), but ${failedCount} failed`);
    } else {
      toast.success(`Deleted ${deletable.length} post(s)${blocked > 0 ? `, skipped ${blocked} posted` : ""}`);
    }
  };

  // Handle single AI generation
  const handleGenerateAI = async (postId: string, platform: string, tone: CaptionTone) => {
    setGeneratingPlatforms((prev) => new Set(prev).add(platform));
    const toastId = toast.loading(`Generating ${platform} caption...`);
    try {
      const post = posts.find((p) => p.id === postId);
      const descriptions = { [postId]: post?.description || "" };

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds: [postId], platforms: [platform], descriptions, tone }),
      });

      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();

      const generated = data.results[postId]?.[platform];
      if (generated?.caption || generated?.title) {
        await handleSaveCaption(postId, platform, generated.title, generated.caption, generated.hashtags);
        toast.success(`Generated ${platform} caption!`, { id: toastId });
      } else {
        toast.error("Generated content was empty — check your description", { id: toastId });
      }
    } catch {
      toast.error("AI generation failed", { id: toastId });
    } finally {
      setGeneratingPlatforms((prev) => {
        const next = new Set(prev);
        next.delete(platform);
        return next;
      });
    }
  };

  // Handle generate all platforms for a single post
  const handleGenerateAllPlatforms = async (postId: string, tone: CaptionTone) => {
    const platforms = ["instagram", "tiktok", "youtube", "facebook", "snapchat", "twitter", "pinterest"];
    setGeneratingPlatforms(new Set(platforms));
    try {
      const post = posts.find((p) => p.id === postId);
      const descriptions = { [postId]: post?.description || "" };

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds: [postId], platforms, descriptions, tone }),
      });

      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();

      const results = data.results[postId] || {};
      for (const [platform, generated] of Object.entries(results)) {
        const g = generated as { title: string; caption: string; hashtags: string };
        if (g.title || g.caption || g.hashtags) {
          await handleSaveCaption(postId, platform, g.title, g.caption, g.hashtags);
        }
      }
      toast.success("Generated captions for all platforms!");
    } catch {
      toast.error("AI generation failed");
    } finally {
      setGeneratingPlatforms(new Set());
    }
  };

  // Handle bulk generate confirm (after modal closes)
  const handleBulkGenerate = async (
    postIds: string[],
    platforms: string[]
  ) => {
    await fetchPosts();
    toast.success(
      `Generated captions for ${postIds.length} post(s) on ${platforms.length} platform(s)!`
    );
    clearSelection();
  };

  const selectedPosts = posts.filter((p) => selectedIds.has(p.id));

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      {/* Global drop overlay */}
      {isDragOverPage && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-violet-900/30 border-4 border-dashed border-violet-500 rounded-none" />
          <div className="relative bg-[var(--bg-panel)] rounded-2xl px-12 py-8 flex flex-col items-center gap-3 shadow-2xl border border-violet-500/50">
            <svg className="w-12 h-12 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-[var(--text-primary)] text-xl font-semibold">Drop to upload</p>
            <p className="text-[var(--text-muted)] text-sm">Photos and videos supported</p>
          </div>
        </div>
      )}

      <Sidebar
        activePlatform={activePlatform}
        onPlatformChange={setActivePlatform}
        view={view}
        onViewChange={setView}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          platform={activePlatform}
          view={view}
          selectedCount={selectedIds.size}
          onUpload={handleUpload}
          onGenerateCaptions={() => setIsBulkModalOpen(true)}
          onClearSelection={clearSelection}
          onDeleteSelected={handleBulkDelete}
          onUpdateSelectedStatus={handleBulkStatusUpdate}
        />

        {/* Mobile nav — hidden on sm+ where sidebar takes over */}
        <div className="sm:hidden flex flex-col border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]">
          <div className="flex border-b border-[var(--border-subtle)]">
            <button
              onClick={() => setView("grid")}
              className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
                view === "grid" ? "text-violet-400 border-b-2 border-violet-500" : "text-[var(--text-secondary)]"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Grid View
            </button>
            <button
              onClick={() => setView("library")}
              className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
                view === "library" ? "text-violet-400 border-b-2 border-violet-500" : "text-[var(--text-secondary)]"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Media Library
            </button>
          </div>
          {view === "grid" && (
            <div className="flex overflow-x-auto gap-1 px-3 py-2 scrollbar-none">
              {(["instagram","tiktok","youtube","facebook","snapchat","twitter","pinterest"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePlatform(p)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all",
                    activePlatform === p
                      ? "bg-violet-600 text-white"
                      : "bg-[var(--hover-subtle)] text-[var(--text-secondary)]"
                  )}
                >
                  {p === "twitter" ? "Twitter / X" : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-6">
            {view === "grid" ? (
              <PlatformGrid
                platform={activePlatform}
                posts={posts}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onPostClick={setEditingPost}
                onReorder={handleReorder}
              />
            ) : (
              <MediaLibrary
                posts={posts}
                onUpload={handleUpload}
                onPostClick={setEditingPost}
                onDeletePost={handleDeletePost}
                isUploading={isUploading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Post Editor slide-in panel */}
      <PostEditor
        post={editingPost}
        posts={posts}
        onNavigate={setEditingPost}
        onClose={() => setEditingPost(null)}
        onSaveCaption={handleSaveCaption}
        onUpdateStatus={handleUpdateStatus}
        onGenerateAI={handleGenerateAI}
        onGenerateAllPlatforms={handleGenerateAllPlatforms}
        generatingPlatforms={generatingPlatforms}
        onRenamePost={handleRenamePost}
        onSaveDescription={handleSaveDescription}
        onAnalyzeComplete={handleAnalyzeComplete}
        onDeletePost={handleDeletePost}
      />

      {/* Bulk Generate Modal */}
      <BulkGenerateModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedPosts={selectedPosts}
        onGenerate={handleBulkGenerate}
      />
    </div>
  );
}
