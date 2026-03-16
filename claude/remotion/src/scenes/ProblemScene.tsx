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

export const ProblemScene: React.FC<Props> = ({ colorScheme, durationFrames, isVertical = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Cards bounce in one at a time with scale animation
  const items = [
    {
      delay: 5,
      label: "Screen Recorder",
      icon: "⏺",
      detail: "fumbling through it...",
      bgGradient: "linear-gradient(135deg, #FEF2F2, #FEE2E2)",
      borderColor: "#FECACA",
    },
    {
      delay: 65,
      label: "Video Editing",
      icon: "🎬",
      detail: "not your thing...",
      bgGradient: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
      borderColor: "#FED7AA",
    },
    {
      delay: 125,
      label: "Your Precious Time",
      icon: "⏰",
      detail: "wasted on this...",
      bgGradient: "linear-gradient(135deg, #FEF2F2, #FEE2E2)",
      borderColor: "#FECACA",
    },
  ];

  // Sad result bounces in big
  const resultDelay = 190;
  const resultScale = spring({ frame: Math.max(0, frame - resultDelay), fps, from: 0.2, to: 1, config: { damping: 7, mass: 0.6 } });
  const resultOpacity = interpolate(frame, [resultDelay, resultDelay + 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  // Subtle shake on the sad result
  const shake = frame > resultDelay + 20 ? Math.sin((frame - resultDelay) * 0.5) * 3 : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colorScheme.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: "6%",
        gap: 48,
      }}
    >
      {/* Cards — horizontal row or vertical stack depending on orientation */}
      <div style={{ display: "flex", flexDirection: isVertical ? "column" : "row", gap: isVertical ? 28 : 44 }}>
        {items.map((item, i) => {
          const scale = spring({ frame: Math.max(0, frame - item.delay), fps, from: 0.3, to: 1, config: { damping: 8, mass: 0.6 } });
          const opacity = interpolate(frame, [item.delay, item.delay + 12], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          // Fade out when next card appears
          const nextDelay = items[i + 1]?.delay;
          const dimmed = nextDelay ? interpolate(frame, [nextDelay, nextDelay + 10], [1, 0.35], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }) : 1;

          return (
            <div
              key={i}
              style={{
                opacity: opacity * dimmed,
                transform: `scale(${scale})`,
                background: item.bgGradient,
                borderRadius: 28,
                padding: "52px 60px",
                textAlign: "center",
                border: `3px solid ${item.borderColor}`,
                minWidth: 320,
                boxShadow: "0 12px 48px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ fontSize: 110 }}>{item.icon}</div>
              <div style={{ color: colorScheme.text, fontSize: 30, marginTop: 20, fontFamily: "system-ui", fontWeight: 700 }}>
                {item.label}
              </div>
              <div style={{ color: "#EF4444", fontSize: 22, marginTop: 12, fontFamily: "system-ui", fontWeight: 600 }}>
                {item.detail}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sad result — big bounce */}
      {frame >= resultDelay && (
        <div
          style={{
            opacity: resultOpacity,
            transform: `scale(${resultScale}) translateX(${shake}px)`,
            background: "linear-gradient(135deg, #FEF2F2, #FFF1F2)",
            borderRadius: 28,
            padding: "56px 100px",
            textAlign: "center",
            border: "3px solid #EF4444",
            boxShadow: "0 16px 64px rgba(239,68,68,0.18)",
          }}
        >
          <div style={{ fontSize: 120 }}>😬</div>
          <div style={{ color: colorScheme.text, fontSize: 34, marginTop: 24, fontFamily: "system-ui", fontWeight: 800 }}>
            You're a builder, not a video editor.
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
