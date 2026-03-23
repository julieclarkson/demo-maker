import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { Terminal } from "../components/Terminal";

interface Props {
  colorScheme: { background: string; accent: string; text: string; muted: string; secondary: string };
  animationStyle: string;
  durationFrames: number;
  isVertical?: boolean;
}

export const HookScene: React.FC<Props> = ({ colorScheme, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Terminal bounces in — "you shipped your product" (0-60)
  const terminalScale = spring({ frame, fps, from: 0.5, to: 1, config: { damping: 8, mass: 0.7 } });
  const terminalOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  const lines = [
    { text: "$ git push origin main", delay: 15 },
    { text: "✓ Build passed", delay: 40, color: "#16a34a" },
    { text: "✓ Deployed to production", delay: 55, color: "#16a34a" },
  ];

  // Phase 2: Terminal shrinks, visitor cards slide up — "someone lands on your repo" (70-110)
  const terminalShrink = interpolate(frame, [70, 95], [1, 0.5], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const terminalSlideUp = interpolate(frame, [70, 95], [0, -160], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const visitorOpacity = interpolate(frame, [85, 105], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const visitorSlideUp = spring({ frame: Math.max(0, frame - 85), fps, from: 80, to: 0, config: { damping: 10 } });

  // Visitor avatars bounce in one by one
  const visitors = [
    { emoji: "𝕏", label: "Twitter", delay: 90 },
    { emoji: "PH", label: "Product Hunt", delay: 100 },
    { emoji: "📱", label: "Instagram", delay: 110 },
  ];

  // Phase 3: Everything blurs + dims, headline zooms in (130-180)
  const blurAmount = interpolate(frame, [130, 148], [0, 12], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const bgDim = interpolate(frame, [130, 148], [1, 0.2], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const headlineScale = spring({ frame: Math.max(0, frame - 132), fps, from: 0.15, to: 1, config: { damping: 7, mass: 0.5 } });
  const headlineOpacity = interpolate(frame, [132, 150], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: colorScheme.background }}>
      {/* Terminal + visitors layer */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 36px 8% 36px",
          filter: `blur(${blurAmount}px)`,
          opacity: bgDim,
        }}
      >
        <div style={{
          opacity: terminalOpacity,
          transform: `scale(${terminalScale * terminalShrink}) translateY(${terminalSlideUp}px)`,
          width: "92%",
          maxWidth: 1300,
        }}>
          <Terminal lines={lines} frame={frame} colorScheme={colorScheme} />
        </div>

        {/* Visitors arriving — "someone lands on your repo" */}
        <div
          style={{
            opacity: visitorOpacity,
            transform: `translateY(${visitorSlideUp}px)`,
            marginTop: 28,
            display: "flex",
            gap: 32,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {visitors.map((v, i) => {
            const scale = spring({
              frame: Math.max(0, frame - v.delay),
              fps,
              from: 0.3,
              to: 1,
              config: { damping: 8, mass: 0.5 },
            });
            return (
              <div
                key={i}
                style={{
                  transform: `scale(${scale})`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    background: "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 52,
                    border: "3px solid #E5E7EB",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                  }}
                >
                  {v.emoji}
                </div>
                <div style={{
                  fontFamily: "system-ui",
                  fontSize: 20,
                  fontWeight: 600,
                  color: colorScheme.muted,
                }}>
                  {v.label}
                </div>
              </div>
            );
          })}

          {/* Speech bubble — "Where's the demo?" */}
          <div
            style={{
              opacity: interpolate(frame, [115, 125], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
              transform: `scale(${spring({ frame: Math.max(0, frame - 115), fps, from: 0.5, to: 1, config: { damping: 8 } })})`,
              background: "#F9FAFB",
              borderRadius: 20,
              padding: "20px 32px",
              fontFamily: "system-ui",
              fontSize: 26,
              fontWeight: 700,
              color: colorScheme.text,
              border: "2px solid #E5E7EB",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              marginLeft: 8,
            }}
          >
            Each wants a video 🎬
          </div>
        </div>
      </AbsoluteFill>

      {/* MASSIVE headline — "They want a demo" */}
      {frame >= 132 && (
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              opacity: headlineOpacity,
              transform: `scale(${headlineScale})`,
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: 120,
              fontWeight: 900,
              color: colorScheme.accent,
              textAlign: "center",
              lineHeight: 1.1,
              textShadow: "0 6px 60px rgba(37,99,235,0.3)",
              maxWidth: "90%",
              letterSpacing: -3,
            }}
          >
            Actually — several.
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
