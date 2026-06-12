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
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#0d0d16",
          position: "relative",
        }}
      >
        {/* Decorative bars — bottom-left corner */}
        <div style={{ display: "flex", position: "absolute", bottom: "40px", left: "60px", gap: "10px", alignItems: "flex-end" }}>
          {[80, 50, 100, 40, 70].map((h, i) => (
            <div key={i} style={{ display: "flex", width: "28px", height: `${h}px`, backgroundColor: "#7c3aed", borderRadius: "4px 4px 0 0", opacity: 0.12 + i * 0.1 }} />
          ))}
        </div>
        {/* Decorative bars — top-right corner */}
        <div style={{ display: "flex", position: "absolute", top: "40px", right: "60px", gap: "10px", alignItems: "flex-end" }}>
          {[60, 90, 45, 110, 65].map((h, i) => (
            <div key={i} style={{ display: "flex", width: "28px", height: `${h}px`, backgroundColor: "#7c3aed", borderRadius: "4px 4px 0 0", opacity: 0.1 + i * 0.08 }} />
          ))}
        </div>

        {/* Accent bar */}
        <div style={{ display: "flex", width: "56px", height: "5px", backgroundColor: "#7c3aed", borderRadius: "3px", marginBottom: "40px" }} />

        {/* App name */}
        <div style={{ display: "flex", justifyContent: "center", fontSize: "96px", fontWeight: 800, color: "#ffffff", letterSpacing: "-4px", marginBottom: "24px", lineHeight: 1 }}>
          Boardplan
        </div>

        {/* Tagline */}
        <div style={{ display: "flex", justifyContent: "center", fontSize: "32px", color: "#6b7280", fontWeight: 400 }}>
          Plan, organize, and caption your social content
        </div>

        {/* Platform badges */}
        <div style={{ display: "flex", marginTop: "52px", gap: "12px" }}>
          {["Instagram", "TikTok", "YouTube", "Facebook", "Pinterest"].map((label) => (
            <div key={label} style={{ display: "flex", backgroundColor: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: "8px", padding: "10px 18px" }}>
              <span style={{ color: "#9ca3af", fontSize: "17px" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
