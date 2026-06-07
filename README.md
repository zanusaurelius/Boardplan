
# Boardplan

A social media content planning tool with AI-powered caption generation. Plan, organize, and generate platform-native captions for posts across Instagram, TikTok, YouTube, Facebook, Twitter, Snapchat, and Pinterest — all from a single drag-and-drop grid.

## Features

- **Drag-and-drop post grid** — reorder posts visually, with per-platform views that show how content maps across channels
- **AI caption generation** — Claude generates platform-native captions tuned to each platform's tone, format, and character limits; bulk-generate across all platforms at once
- **Slide-in post editor** — edit captions, titles, and hashtags per platform with auto-save
- **Bulk actions** — multi-select posts for batch caption generation or status updates (draft → ready → posted)
- **Media library** — drag-and-drop image and video upload; videos auto-transcode to MP4 and auto-transcribe via Whisper so the transcript feeds into AI caption context
- **Dark / light theme**

<img width="1896" height="926" alt="Screenshot 2026-06-06 at 10 16 13 PM" src="https://github.com/user-attachments/assets/1563df8e-f408-4873-bfda-ab290e34b20f" />
<img width="1907" height="931" alt="Screenshot 2026-06-06 at 10 10 25 PM" src="https://github.com/user-attachments/assets/150b9d85-77e3-4bdf-abeb-7c1065a02d8c" />
<img width="1913" height="933" alt="Screenshot 2026-06-06 at 10 10 08 PM" src="https://github.com/user-attachments/assets/3e2a106f-776a-47a6-b351-9a49a1364b5c" />

## Tech stack

- **Next.js 16** / **React 19** / **TypeScript**
- **SQLite** via Prisma + libSQL
- **Claude API** (Anthropic) — caption generation
- **Whisper API** (OpenAI) — video transcription
- **dnd-kit** — drag-and-drop
- **Tailwind CSS v4** + shadcn/ui

## Getting started

### Prerequisites

- Node.js 20+
- An Anthropic API key (for caption generation)
- An OpenAI API key (for video transcription)

### Setup

```bash
npm install
```

Create a `.env.local` file:

```env
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
```

Run the database migrations:

```bash
npx prisma migrate deploy
```

Optionally seed with sample posts:

```bash
npm run seed
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

SQLite via Prisma. Schema lives in `prisma/schema.prisma`. Three models: `Post`, `Media`, and `Caption` (one caption row per post per platform).

Migrations: `prisma/migrations/`

## Project structure

```
app/
  api/         # Route handlers (posts, captions, media, AI)
  page.tsx     # Main grid view
components/
  grid/        # DraggableGrid, PlatformGrid, PostCard
  post/        # PostEditor, CaptionEditor, BulkGenerateModal
  library/     # MediaLibrary, UploadZone
  layout/      # Sidebar, TopBar, ThemeProvider
lib/
  claude.ts    # Caption generation
  transcribe.ts # Whisper transcription
  video.ts     # Video transcoding
  db.ts        # Prisma client
  storage.ts   # File storage helpers
public/uploads/ # Uploaded media files
```
