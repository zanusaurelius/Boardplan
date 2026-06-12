import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Boardplan — Social Media Content Planner";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#0d0d16",
          padding: "80px 90px",
          position: "relative",
        }}
      >
        {/* Decorative platform columns top-right */}
        <div style={{ display: "flex", position: "absolute", top: "50px", right: "80px", gap: "12px", alignItems: "flex-end" }}>
          {[120, 80, 140, 60, 100].map((h, i) => (
            <div key={i} style={{ display: "flex", width: "32px", height: `${h}px`, backgroundColor: "#7c3aed", borderRadius: "6px 6px 0 0", opacity: 0.15 + i * 0.12 }} />
          ))}
        </div>

        {/* Accent bar */}
        <div style={{ display: "flex", width: "56px", height: "5px", backgroundColor: "#7c3aed", borderRadius: "3px", marginBottom: "48px" }} />

        {/* App name */}
        <div style={{ display: "flex", fontSize: "88px", fontWeight: 800, color: "#ffffff", letterSpacing: "-3px", marginBottom: "28px", lineHeight: 1 }}>
          Boardplan
        </div>

        {/* Tagline */}
        <div style={{ display: "flex", fontSize: "34px", color: "#6b7280", fontWeight: 400, letterSpacing: "-0.5px" }}>
          Plan, organize, and caption your social content
        </div>

        {/* Bottom platform badges */}
        <div style={{ display: "flex", marginTop: "auto", gap: "14px" }}>
          {["Instagram", "TikTok", "YouTube", "Facebook", "Pinterest"].map((label) => (
            <div key={label} style={{ display: "flex", backgroundColor: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: "8px", padding: "8px 16px" }}>
              <span style={{ color: "#9ca3af", fontSize: "17px" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
