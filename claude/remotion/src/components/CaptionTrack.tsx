import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface Scene {
  id: number;
  segment: string;
  narration?: string;
  startFrame: number;
  endFrame: number;
}

interface Props {
  scenes: Scene[];
  colorScheme: { text: string };
}

export const CaptionTrack: React.FC<Props> = ({ scenes }) => {
  const frame = useCurrentFrame();

  const currentScene = scenes.find(
    (s) => frame >= s.startFrame && frame < s.endFrame
  );

  if (!currentScene?.narration) return null;

  const fadeIn = interpolate(
    frame,
    [currentScene.startFrame, currentScene.startFrame + 10],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  const fadeOut = interpolate(
    frame,
    [currentScene.endFrame - 10, currentScene.endFrame],
    [1, 0],
    { extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: "80%",
        textAlign: "center",
        opacity: Math.min(fadeIn, fadeOut),
      }}
    >
      <div
        style={{
          display: "inline-block",
          background: "rgba(0, 0, 0, 0.85)",
          borderRadius: 8,
          padding: "12px 24px",
          fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', Consolas, 'Courier New', monospace",
          fontSize: 20,
          color: "#FFFFFF",
          lineHeight: 1.5,
          letterSpacing: 0.3,
          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
        }}
      >
        {currentScene.narration}
      </div>
    </div>
  );
};
