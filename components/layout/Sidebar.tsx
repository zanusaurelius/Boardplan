"use client";

import { cn } from "@/lib/utils";
import { FaInstagram, FaFacebook, FaYoutube, FaPinterest } from "react-icons/fa";
import { FaTiktok, FaXTwitter, FaSnapchat } from "react-icons/fa6";
import { useTheme } from "./ThemeProvider";

export type Platform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "snapchat"
  | "twitter"
  | "pinterest";

interface SidebarProps {
  activePlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
  view: "grid" | "library";
  onViewChange: (view: "grid" | "library") => void;
}

type PlatformConfig = {
  id: Platform;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
};

const PLATFORMS: PlatformConfig[] = [
  { id: "instagram", label: "Instagram", Icon: FaInstagram, iconColor: "text-pink-500" },
  { id: "tiktok",    label: "TikTok",    Icon: FaTiktok,    iconColor: "text-[var(--text-primary)]" },
  { id: "youtube",   label: "YouTube",   Icon: FaYoutube,   iconColor: "text-red-500" },
  { id: "facebook",  label: "Facebook",  Icon: FaFacebook,  iconColor: "text-blue-500" },
  { id: "snapchat",  label: "Snapchat",  Icon: FaSnapchat,  iconColor: "text-yellow-400" },
  { id: "twitter",   label: "Twitter / X", Icon: FaXTwitter, iconColor: "text-[var(--text-primary)]" },
  { id: "pinterest", label: "Pinterest", Icon: FaPinterest, iconColor: "text-red-500" },
];

export default function Sidebar({
  activePlatform,
  onPlatformChange,
  view,
  onViewChange,
}: SidebarProps) {
  const { theme, toggle } = useTheme();
  return (
    <aside className="w-56 bg-[var(--bg-panel)] border-r border-[var(--border-subtle)] flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-[var(--border-subtle)]">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onViewChange("grid")}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              view === "grid"
                ? "bg-violet-600 text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-subtle)]"
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Grid View
          </button>
          <button
            onClick={() => onViewChange("library")}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              view === "library"
                ? "bg-violet-600 text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-subtle)]"
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Media Library
          </button>
        </div>
      </div>

      {view === "grid" && (
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-3 px-1">
            Platforms
          </p>
          <nav className="flex flex-col gap-1">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => onPlatformChange(platform.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                  activePlatform === platform.id
                    ? "bg-violet-600/20 text-violet-400 border border-violet-600/30"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-subtle)]"
                )}
              >
                <platform.Icon className={cn("w-4 h-4 shrink-0", activePlatform === platform.id ? "text-violet-400" : platform.iconColor)} />
                <span>{platform.label}</span>
                {activePlatform === platform.id && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
                )}
              </button>
            ))}
          </nav>
        </div>
      )}

      <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
        <p className="text-[var(--text-faint)] text-xs">Boardplan v1.0</p>
        <button
          onClick={toggle}
          className="p-1.5 rounded-lg hover:bg-[var(--hover-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </aside>
  );
}
