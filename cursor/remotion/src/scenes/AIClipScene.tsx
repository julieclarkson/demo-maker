import React from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";

interface Props {
  videoPath: string;
  provider: "veo3" | "runway";
}

export const AIClipScene: React.FC<Props> = ({ videoPath, provider }) => {
  return (
    <AbsoluteFill>
      <OffthreadVideo src={videoPath} style={{ width: "100%", height: "100%" }} />
    </AbsoluteFill>
  );
};
