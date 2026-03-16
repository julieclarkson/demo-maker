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

export const CaptionTrack: React.FC<Props> = ({ scenes, colorScheme }) => {
  const frame = useCurrentFrame();

  // Find current scene
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
          background: "rgba(0, 0, 0, 0.75)",
          borderRadius: 8,
          padding: "10px 20px",
          fontFamily: "system-ui, sans-serif",
          fontSize: 20,
          color: colorScheme.text,
          lineHeight: 1.4,
        }}
      >
        {currentScene.narration}
      </div>
    </div>
  );
};
