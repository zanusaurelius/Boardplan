"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onUpload: (files: FileList) => void;
  isUploading?: boolean;
}

export default function UploadZone({ onUpload, isUploading }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        onUpload(e.dataTransfer.files);
      }
    },
    [onUpload]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200",
        isDragOver
          ? "border-violet-500 bg-violet-500/10"
          : "border-[var(--border-light)] hover:border-[var(--border-medium)] bg-[var(--hover-subtle)] hover:bg-[var(--hover-light)]",
        isUploading && "pointer-events-none opacity-70"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-col items-center gap-4">
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
          isDragOver ? "bg-violet-500/20" : "bg-[var(--hover-subtle)]"
        )}>
          {isUploading ? (
            <svg className="w-8 h-8 text-violet-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg
              className={cn("w-8 h-8 transition-colors", isDragOver ? "text-violet-400" : "text-[var(--text-muted)]")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
        </div>

        <div>
          <p className={cn("text-base font-medium mb-1 transition-colors", isDragOver ? "text-violet-400" : "text-[var(--text-secondary)]")}>
            {isDragOver ? "Drop files here" : isUploading ? "Uploading..." : "Drop files or click to upload"}
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            JPG, PNG, GIF, WebP, MP4, MOV, WebM
          </p>
          <p className="text-xs text-[var(--text-faint)] mt-1">Batch upload supported</p>
        </div>
      </div>
    </div>
  );
}
