import React from "react";
import { Composition } from "remotion";
import { DemoVideo, calculateTotalFrames } from "./DemoVideo";

const LIGHT_SCHEME = {
  background: "#FFFFFF",
  accent: "#2563EB",
  secondary: "#7C3AED",
  text: "#111827",
  muted: "#6B7280",
};

const FPS = 30;

const defaultProps = {
  storyboard: null,
  narrationDir: null,
  capturesDir: null,
  colorScheme: LIGHT_SCHEME,
  animationStyle: "motion-graphics" as const,
  availableNarration: [],
  isVertical: false,
  sceneDurations: {} as Record<string, number>,
};

const calcMetadata = ({ props }: { props: typeof defaultProps & { platform: string } }) => {
  return {
    durationInFrames: calculateTotalFrames(props.platform, FPS, props.sceneDurations, props.storyboard),
    fps: FPS,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Full / YouTube — 1920x1080 */}
      <Composition
        id="DemoFull"
        component={DemoVideo}
        durationInFrames={calculateTotalFrames("full", FPS)}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ ...defaultProps, platform: "full" }}
        calculateMetadata={calcMetadata}
      />

      {/* Twitter / X — 1920x1080 */}
      <Composition
        id="DemoTwitter"
        component={DemoVideo}
        durationInFrames={calculateTotalFrames("twitter", FPS)}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ ...defaultProps, platform: "twitter" }}
        calculateMetadata={calcMetadata}
      />

      {/* Product Hunt — 1920x1080 */}
      <Composition
        id="DemoProductHunt"
        component={DemoVideo}
        durationInFrames={calculateTotalFrames("producthunt", FPS)}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ ...defaultProps, platform: "producthunt" }}
        calculateMetadata={calcMetadata}
      />

      {/* GitHub — 1920x1080 */}
      <Composition
        id="DemoGitHub"
        component={DemoVideo}
        durationInFrames={calculateTotalFrames("github", FPS)}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ ...defaultProps, platform: "github" }}
        calculateMetadata={calcMetadata}
      />

      {/* Instagram Reels — 1080x1920 (vertical) */}
      <Composition
        id="DemoInstagram"
        component={DemoVideo}
        durationInFrames={calculateTotalFrames("instagram", FPS)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ ...defaultProps, platform: "instagram", isVertical: true }}
        calculateMetadata={calcMetadata}
      />

      {/* TikTok — 1080x1920 (vertical) */}
      <Composition
        id="DemoTikTok"
        component={DemoVideo}
        durationInFrames={calculateTotalFrames("tiktok", FPS)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ ...defaultProps, platform: "tiktok", isVertical: true }}
        calculateMetadata={calcMetadata}
      />

      {/* Legacy ID for backwards compatibility */}
      <Composition
        id="DemoVideo"
        component={DemoVideo}
        durationInFrames={calculateTotalFrames("full", FPS)}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ ...defaultProps, platform: "full" }}
        calculateMetadata={calcMetadata}
      />
    </>
  );
};
