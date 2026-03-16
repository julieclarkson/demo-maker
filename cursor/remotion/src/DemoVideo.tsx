import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { HookScene } from "./scenes/HookScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { TurnScene } from "./scenes/TurnScene";
import { WorkflowScene } from "./scenes/WorkflowScene";
import { OutputScene } from "./scenes/OutputScene";
import { CTAScene } from "./scenes/CTAScene";
import { AIClipScene } from "./scenes/AIClipScene";
import { Watermark } from "./components/Watermark";
import { CaptionTrack } from "./components/CaptionTrack";

interface ColorScheme {
  background: string;
  accent: string;
  secondary: string;
  text: string;
  muted: string;
}

interface AIClip {
  sceneId: number;
  videoPath: string;
  provider: "veo3" | "runway";
}

interface StoryboardScene {
  id: number;
  segment: string;
  duration_ms: number;
  narration: string;
  priority: number;
}

interface DemoVideoProps {
  platform: string;
  storyboard: { scenes: StoryboardScene[] } | null;
  narrationDir: string | null;
  capturesDir: string | null;
  aiClips: AIClip[];
  colorScheme: ColorScheme;
  animationStyle: "motion-graphics" | "cinematic" | "developer-authentic";
  availableNarration?: number[];
  isVertical?: boolean;
  /** Per-scene durations in ms, keyed by scene number (1-indexed).
   *  When provided, these override the hardcoded PLATFORM_CONFIGS durations.
   *  This ensures each scene is exactly long enough for its narration audio. */
  sceneDurations?: Record<string, number>;
}

const SCENE_COMPONENTS: Record<string, React.FC<any>> = {
  hook: HookScene,
  problem: ProblemScene,
  turn: TurnScene,
  demo: WorkflowScene,
  result: OutputScene,
  cta: CTAScene,
};

// Duration configs per platform (in seconds).
// Each scene must be long enough for the narration to finish before the transition.
// Rule of thumb: ~400ms per word + 2–3s padding for natural pacing and breathing room.
const PLATFORM_CONFIGS: Record<string, { segment: string; duration: number }[]> = {
  full: [
    { segment: "hook", duration: 14 },
    { segment: "problem", duration: 17 },
    { segment: "turn", duration: 21 },
    { segment: "demo", duration: 23 },
    { segment: "result", duration: 10 },
    { segment: "cta", duration: 15 },
  ],
  twitter: [
    { segment: "hook", duration: 15 },
    { segment: "turn", duration: 14 },
    { segment: "cta", duration: 15 },
  ],
  producthunt: [
    { segment: "hook", duration: 10 },
    { segment: "problem", duration: 13 },
    { segment: "turn", duration: 16 },
    { segment: "result", duration: 10 },
    { segment: "cta", duration: 23 },
  ],
  github: [
    { segment: "hook", duration: 12 },
    { segment: "problem", duration: 13 },
    { segment: "turn", duration: 13 },
    { segment: "demo", duration: 13 },
    { segment: "result", duration: 9 },
    { segment: "cta", duration: 19 },
  ],
  instagram: [
    { segment: "hook", duration: 13 },
    { segment: "turn", duration: 14 },
    { segment: "result", duration: 9 },
    { segment: "cta", duration: 19 },
  ],
  tiktok: [
    { segment: "hook", duration: 10 },
    { segment: "turn", duration: 11 },
    { segment: "result", duration: 9 },
    { segment: "cta", duration: 19 },
  ],
  gif: [
    { segment: "hook", duration: 14 },
  ],
};

// How many frames the content fades out/in at each scene boundary.
// 12 frames = 0.4s — smooth and visible, not too slow.
const FADE_FRAMES = 12;

/**
 * Calculate total frames for a platform. Scenes are sequential (no overlap).
 * When sceneDurations are provided (from actual audio measurement),
 * those override the hardcoded defaults.
 */
export function calculateTotalFrames(
  platform: string,
  fps: number,
  sceneDurations?: Record<string, number>
): number {
  const config = PLATFORM_CONFIGS[platform] || PLATFORM_CONFIGS.full;
  return config.reduce((sum, s, index) => {
    const sceneNum = String(index + 1);
    if (sceneDurations && sceneDurations[sceneNum]) {
      // Use actual audio duration (in ms) converted to frames
      return sum + Math.ceil((sceneDurations[sceneNum] / 1000) * fps);
    }
    return sum + s.duration * fps;
  }, 0);
}

export const DemoVideo: React.FC<DemoVideoProps> = ({
  platform,
  storyboard,
  narrationDir,
  aiClips,
  colorScheme,
  animationStyle,
  availableNarration = [],
  isVertical = false,
  sceneDurations = {},
}) => {
  const { fps, durationInFrames } = useVideoConfig();

  const config = PLATFORM_CONFIGS[platform] || PLATFORM_CONFIGS.full;

  // Build sequential timeline.
  // When sceneDurations are provided (from actual audio measurement),
  // use those instead of the hardcoded defaults.
  let offset = 0;
  const timeline = config.map((scene, index) => {
    const sceneNum = String(index + 1);
    let durationFrames: number;
    if (sceneDurations[sceneNum]) {
      // Actual audio duration (ms) → frames
      durationFrames = Math.ceil((sceneDurations[sceneNum] / 1000) * fps);
    } else {
      durationFrames = scene.duration * fps;
    }
    const startFrame = offset;
    offset += durationFrames;
    return {
      id: index + 1,
      segment: scene.segment,
      durationFrames,
      startFrame,
      endFrame: startFrame + durationFrames,
    };
  });

  const getAIClip = (sceneId: number) => aiClips.find((c) => c.sceneId === sceneId);

  return (
    <AbsoluteFill style={{ backgroundColor: colorScheme.background }}>
      {timeline.map((scene, index) => {
        const aiClip = getAIClip(scene.id);
        const SceneComponent = SCENE_COMPONENTS[scene.segment];
        const isFirst = index === 0;
        const isLast = index === timeline.length - 1;

        return (
          <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationFrames}>
            {/*
              ContentFade wraps the scene content and fades it in/out.
              The white background stays solid — only the content fades.
              This creates a clean "dissolve through white" effect.
            */}
            <ContentFade
              durationFrames={scene.durationFrames}
              fadeIn={!isFirst}
              fadeOut={!isLast}
              fadeFrames={FADE_FRAMES}
            >
              {aiClip ? (
                <AIClipScene videoPath={aiClip.videoPath} provider={aiClip.provider} />
              ) : SceneComponent ? (
                <SceneComponent
                  colorScheme={colorScheme}
                  animationStyle={animationStyle}
                  durationFrames={scene.durationFrames}
                  isVertical={isVertical}
                />
              ) : (
                <AbsoluteFill />
              )}
            </ContentFade>

            {availableNarration.includes(scene.id) && (
              <Audio src={staticFile(`narration/${platform}/scene-${scene.id}.mp3`)} />
            )}
          </Sequence>
        );
      })}

      <CaptionTrack scenes={timeline} colorScheme={colorScheme} />
      <Watermark totalFrames={durationInFrames} fps={fps} colorScheme={colorScheme} />
    </AbsoluteFill>
  );
};

/**
 * Fades the scene CONTENT in and out, leaving the white background visible.
 *
 * At end of scene A: content opacity goes 1 → 0 (white bg shows through)
 * At start of scene B: content opacity goes 0 → 1 (new content appears)
 *
 * This creates a clean dissolve-through-white without any overlapping sequences,
 * z-order issues, or ghosting artifacts.
 */
const ContentFade: React.FC<{
  durationFrames: number;
  fadeIn: boolean;
  fadeOut: boolean;
  fadeFrames: number;
  children: React.ReactNode;
}> = ({ durationFrames, fadeIn, fadeOut, fadeFrames, children }) => {
  const frame = useCurrentFrame();

  let opacity = 1;

  // Fade in: content appears from transparent
  if (fadeIn) {
    const fadeInOpacity = interpolate(frame, [0, fadeFrames], [0, 1], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
      easing: Easing.out(Easing.quad),
    });
    opacity = Math.min(opacity, fadeInOpacity);
  }

  // Fade out: content disappears to transparent (white bg shows)
  if (fadeOut) {
    const fadeOutOpacity = interpolate(
      frame,
      [durationFrames - fadeFrames, durationFrames],
      [1, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.in(Easing.quad),
      }
    );
    opacity = Math.min(opacity, fadeOutOpacity);
  }

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
