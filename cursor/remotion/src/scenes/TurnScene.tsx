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

export const TurnScene: React.FC<Props> = ({ colorScheme, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Terminal zooms in with bounce
  const terminalScale = spring({ frame, fps, from: 0.6, to: 1, config: { damping: 9, mass: 0.7 } });
  const terminalOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const commandLine = { text: "$ demo-maker", delay: 20 };

  const checkmarks = [
    { text: "✓ Codebase analyzed — 94 files scanned", delay: 55, color: "#16a34a" },
    { text: "✓ Key features identified", delay: 75, color: "#16a34a" },
    { text: "✓ Demo script generated", delay: 95, color: "#16a34a" },
    { text: "✓ Ready to build your demo", delay: 115, color: colorScheme.accent },
  ];

  const allLines = [commandLine, ...checkmarks];

  // File type badges bounce in with stagger
  const fileTypes = [
    { ext: ".js", color: "#F59E0B" },
    { ext: ".md", color: "#3B82F6" },
    { ext: ".json", color: "#10B981" },
    { ext: ".sh", color: "#8B5CF6" },
    { ext: ".yml", color: "#EC4899" },
  ];
  const fanStart = 135;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colorScheme.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 36px 8% 36px",
      }}
    >
      <div style={{
        opacity: terminalOpacity,
        transform: `scale(${terminalScale})`,
        width: "92%",
        maxWidth: 1300,
      }}>
        <Terminal lines={allLines} frame={frame} colorScheme={colorScheme} />
      </div>

      {/* File type badges — vibrant colors, bounce in */}
      <div style={{ display: "flex", gap: 28, marginTop: 52, justifyContent: "center" }}>
        {fileTypes.map((ft, i) => {
          const delay = fanStart + i * 8;
          const scale = spring({
            frame: Math.max(0, frame - delay),
            fps,
            from: 0,
            to: 1,
            config: { damping: 8, mass: 0.5 },
          });
          const pulse = interpolate(
            frame,
            [delay + 15, delay + 30, delay + 50],
            [1, 1.15, 1],
            { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
          );

          return (
            <div
              key={ft.ext}
              style={{
                transform: `scale(${scale * pulse})`,
                background: `${ft.color}15`,
                borderRadius: 18,
                padding: "22px 36px",
                fontFamily: "'SF Mono', Consolas, monospace",
                fontSize: 28,
                fontWeight: 700,
                color: ft.color,
                border: `3px solid ${ft.color}`,
                boxShadow: `0 6px 28px ${ft.color}25`,
              }}
            >
              {ft.ext}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
