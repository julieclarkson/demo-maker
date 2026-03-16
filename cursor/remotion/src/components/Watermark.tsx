import React from "react";
import { interpolate } from "remotion";

interface Props {
  totalFrames: number;
  fps: number;
  colorScheme: { muted: string };
}

export const Watermark: React.FC<Props> = ({ totalFrames, fps, colorScheme }) => {
  const watermarkStart = totalFrames - 3 * fps; // Last 3 seconds

  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        right: 32,
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        color: colorScheme.muted,
        opacity: 0.7,
        pointerEvents: "none",
      }}
    >
      Made with Demo Maker
    </div>
  );
};
