import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

interface Props {
  colorScheme: { background: string; accent: string; text: string; muted: string; secondary: string };
  animationStyle: string;
  durationFrames: number;
  isVertical?: boolean;
}

const FILES = [
  { name: "demo-full.mp4", badge: "65s", size: "12 MB", color: "#3B82F6", icon: "▶", bg: "#EFF6FF" },
  { name: "demo-github.mp4", badge: "60s", size: "10 MB", color: "#111827", icon: "GH", bg: "#F9FAFB" },
  { name: "demo-twitter.mp4", badge: "30s", size: "4 MB", color: "#111827", icon: "𝕏", bg: "#F9FAFB" },
  { name: "demo-producthunt.mp4", badge: "45s", size: "8 MB", color: "#F97316", icon: "PH", bg: "#FFF7ED" },
  { name: "demo-instagram.mp4", badge: "55s", size: "6 MB", color: "#E4405F", icon: "IG", bg: "#FFF0F3" },
  { name: "demo-tiktok.mp4", badge: "49s", size: "5 MB", color: "#111827", icon: "TT", bg: "#F9FAFB" },
];

export const OutputScene: React.FC<Props> = ({ colorScheme, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header bounces in
  const headerScale = spring({ frame, fps, from: 0.5, to: 1, config: { damping: 9 } });
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colorScheme.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 44px 8% 44px",
        gap: 32,
      }}
    >
      <div
        style={{
          opacity: headerOpacity,
          transform: `scale(${headerScale})`,
          fontFamily: "'SF Mono', Consolas, monospace",
          fontSize: 40,
          fontWeight: 700,
          color: colorScheme.text,
        }}
      >
        📁 demo-output/
      </div>

      {/* File cards — slide in from right with bounce */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "88%", maxWidth: 1100 }}>
        {FILES.map((file, i) => {
          const delay = 35 + i * 18;
          const slideX = spring({
            frame: Math.max(0, frame - delay),
            fps,
            from: 250,
            to: 0,
            config: { damping: 10, mass: 0.7 },
          });
          const opacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          // Pop effect after landing
          const pop = interpolate(
            frame,
            [delay + 20, delay + 30, delay + 40],
            [1, 1.04, 1],
            { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
          );

          return (
            <div
              key={file.name}
              style={{
                opacity,
                transform: `translateX(${slideX}px) scale(${pop})`,
                display: "flex",
                alignItems: "center",
                gap: 24,
                background: file.bg,
                borderRadius: 20,
                padding: "18px 36px",
                borderLeft: `6px solid ${file.color}`,
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ fontSize: 34, width: 60, textAlign: "center", color: file.color, fontFamily: "system-ui", fontWeight: 800 }}>
                {file.icon}
              </div>
              <div style={{ flex: 1, fontFamily: "'SF Mono', Consolas, monospace", fontSize: 26, color: colorScheme.text, fontWeight: 600 }}>
                {file.name}
              </div>
              <div
                style={{
                  background: `${file.color}18`,
                  color: file.color,
                  padding: "8px 20px",
                  borderRadius: 10,
                  fontSize: 20,
                  fontFamily: "system-ui",
                  fontWeight: 700,
                }}
              >
                {file.badge}
              </div>
              <div style={{ color: colorScheme.muted, fontSize: 18, fontFamily: "system-ui", width: 70, textAlign: "right" }}>
                {file.size}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom tagline — zooms in */}
      <div
        style={{
          opacity: interpolate(frame, [150, 175], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
          transform: `scale(${spring({ frame: Math.max(0, frame - 150), fps, from: 0.6, to: 1, config: { damping: 10 } })})`,
          fontFamily: "system-ui",
          fontSize: 40,
          color: colorScheme.accent,
          marginTop: 24,
          fontWeight: 800,
        }}
      >
        Six videos. Ready to ship.
      </div>
    </AbsoluteFill>
  );
};
