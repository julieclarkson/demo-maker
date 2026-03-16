import React from "react";
import { interpolate } from "remotion";

interface Line {
  text: string;
  delay: number;
  color?: string;
}

interface Props {
  lines: Line[];
  frame: number;
  colorScheme: { background: string; accent: string; text: string; muted: string };
}

export const Terminal: React.FC<Props> = ({ lines, frame, colorScheme }) => {
  return (
    <div
      style={{
        background: "#1E293B",
        borderRadius: 20,
        overflow: "hidden",
        fontFamily: "'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
        fontSize: 26,
        lineHeight: 2.1,
        boxShadow: "0 20px 80px rgba(0,0,0,0.2)",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: "16px 24px",
          background: "#334155",
        }}
      >
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#ffbd2e" }} />
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#28c840" }} />
      </div>

      {/* Content */}
      <div style={{ padding: "28px 40px" }}>
        {lines.map((line, i) => {
          const visible = frame >= line.delay;
          if (!visible) return null;

          const charsToShow = Math.floor(
            interpolate(
              frame,
              [line.delay, line.delay + Math.min(20, line.text.length)],
              [0, line.text.length],
              { extrapolateRight: "clamp" }
            )
          );

          const displayText = line.text.substring(0, charsToShow);
          const showCursor = charsToShow < line.text.length;

          return (
            <div key={i} style={{ color: line.color || "#E2E8F0" }}>
              {displayText}
              {showCursor && (
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 24,
                    background: "#38BDF8",
                    marginLeft: 2,
                    opacity: Math.sin(frame * 0.2) > 0 ? 1 : 0,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
