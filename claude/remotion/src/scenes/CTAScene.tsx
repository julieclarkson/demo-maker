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

export const CTAScene: React.FC<Props> = ({ colorScheme, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 390 frames (13s) — dramatic CTA

  // Title zooms in with bounce
  const titleScale = spring({ frame, fps, from: 0.3, to: 1, config: { damping: 7, mass: 0.6 } });
  const titleOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });

  // Tagline slides up
  const taglineOpacity = interpolate(frame, [50, 80], [0, 1], { extrapolateRight: "clamp" });
  const taglineY = spring({ frame: Math.max(0, frame - 50), fps, from: 40, to: 0, config: { damping: 12 } });

  // GitHub star button bounces in
  const starScale = spring({ frame: Math.max(0, frame - 100), fps, from: 0, to: 1, config: { damping: 7, mass: 0.5 } });
  // Star pulses
  const starPulse = interpolate(
    frame,
    [130, 145, 160, 175, 190],
    [1, 1.08, 1, 1.05, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  const urlOpacity = interpolate(frame, [160, 190], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // KEY MESSAGE — Cursor + Cowork + local — big and bold
  const keyMsgScale = spring({ frame: Math.max(0, frame - 210), fps, from: 0.5, to: 1, config: { damping: 8, mass: 0.6 } });
  const keyMsgOpacity = interpolate(frame, [210, 250], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // "Free forever" badge bounces in
  const freeBadgeScale = spring({ frame: Math.max(0, frame - 270), fps, from: 0, to: 1, config: { damping: 7, mass: 0.5 } });
  const freeBadgePulse = interpolate(
    frame,
    [290, 310, 330],
    [1, 1.1, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  const watermarkOpacity = interpolate(frame, [320, 360], [0, 0.6], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Subtle gradient background animation
  const gradientAngle = interpolate(frame, [0, 390], [135, 225], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, ${colorScheme.background} 0%, #EFF6FF 50%, #F5F3FF 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: "6%",
        gap: 20,
      }}
    >
      {/* Title — massive with gradient */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          fontFamily: "system-ui",
          fontSize: 110,
          fontWeight: 800,
          background: `linear-gradient(135deg, ${colorScheme.accent}, ${colorScheme.secondary})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: -3,
        }}
      >
        Demo Maker
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          fontFamily: "system-ui",
          fontSize: 46,
          color: colorScheme.text,
          fontWeight: 500,
        }}
      >
        Your product deserves to be seen.
      </div>

      {/* GitHub star button — bouncy with pulse */}
      <div
        style={{
          transform: `scale(${starScale * starPulse})`,
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: colorScheme.text,
          borderRadius: 20,
          padding: "22px 52px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}
      >
        <span style={{ fontSize: 36 }}>⭐</span>
        <span style={{ fontFamily: "system-ui", fontSize: 28, color: "#FFFFFF", fontWeight: 700 }}>
          Star on GitHub
        </span>
      </div>

      {/* URL */}
      <div
        style={{
          opacity: urlOpacity,
          fontFamily: "'SF Mono', Consolas, monospace",
          fontSize: 24,
          color: colorScheme.accent,
          marginTop: 6,
          fontWeight: 600,
        }}
      >
        github.com/julieclarkson/demo-maker
      </div>

      {/* KEY MESSAGE — Cursor + Cowork + local */}
      <div
        style={{
          opacity: keyMsgOpacity,
          transform: `scale(${keyMsgScale})`,
          marginTop: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: "system-ui",
            fontSize: 32,
            color: colorScheme.text,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Works in Cursor IDE &amp; Claude Cowork
        </div>
        <div
          style={{
            fontFamily: "system-ui",
            fontSize: 34,
            color: colorScheme.accent,
            fontWeight: 800,
            textAlign: "center",
            letterSpacing: -0.5,
          }}
        >
          Your API keys. Your machine. Your demo.
        </div>
      </div>

      {/* Download badge */}
      <div
        style={{
          transform: `scale(${freeBadgeScale * freeBadgePulse})`,
          marginTop: 12,
          background: `linear-gradient(135deg, ${colorScheme.accent}, ${colorScheme.secondary})`,
          borderRadius: 16,
          padding: "14px 44px",
          boxShadow: `0 6px 24px ${colorScheme.accent}40`,
        }}
      >
        <span style={{ fontFamily: "system-ui", fontSize: 24, color: "#FFFFFF", fontWeight: 800, letterSpacing: 0.5 }}>
          DOWNLOAD FROM GITHUB
        </span>
      </div>

      {/* Watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          right: 48,
          opacity: watermarkOpacity,
          fontFamily: "system-ui",
          fontSize: 16,
          color: colorScheme.muted,
        }}
      >
        Made with Demo Maker
      </div>
    </AbsoluteFill>
  );
};
