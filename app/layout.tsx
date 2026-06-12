import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://boardplan.spartanatlas.com"),
  title: "Boardplan – Social Media Content Planner",
  description: "Plan, organize, and caption your social media content",
  openGraph: {
    title: "Boardplan – Social Media Content Planner",
    description: "Plan, organize, and caption your social media content",
    url: "https://boardplan.spartanatlas.com",
    siteName: "Boardplan",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Boardplan – Social Media Content Planner",
    description: "Plan, organize, and caption your social media content",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-[var(--bg-base)] text-[var(--text-primary)] overflow-hidden">
        <ThemeProvider>
          {children}
          <Toaster
            toastOptions={{
              style: {
                background: "var(--bg-panel)",
                border: "1px solid var(--border-light)",
                color: "var(--text-primary)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
