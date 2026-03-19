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
import { StoryboardScene } from "./scenes/StoryboardScene";
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

interface StoryboardVisual {
  type: string;
  text: string;
  subtext?: string;
  style?: string;
  animation?: string;
}

interface StoryboardSceneData {
  id: string;
  segment: string;
  duration_ms: number;
  narration: string;
  visual?: StoryboardVisual;
  priority: number;
}

interface DemoVideoProps {
  platform: string;
  storyboard: { scenes: StoryboardSceneData[]; projectName?: string } | null;
  narrationDir: string | null;
  capturesDir: string | null;
  aiClips: AIClip[];
  colorScheme: ColorScheme;
  animationStyle: "motion-graphics" | "cinematic" | "developer-authentic";
  availableNarration?: number[];
  isVertical?: boolean;
  sceneDurations?: Record<string, number>;
}

const DEFAULT_SCENE_COMPONENTS: Record<string, React.FC<any>> = {
  hook: HookScene,
  problem: ProblemScene,
  turn: TurnScene,
  demo: WorkflowScene,
  result: OutputScene,
  cta: CTAScene,
};

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

const FADE_FRAMES = 12;

/**
 * Calculate total frames for a platform.
 * When a storyboard is provided, use its scene count and durations.
 * sceneDurations (from actual audio) override everything.
 */
export function calculateTotalFrames(
  platform: string,
  fps: number,
  sceneDurations?: Record<string, number>,
  storyboard?: { scenes: StoryboardSceneData[] } | null
): number {
  if (storyboard?.scenes) {
    return storyboard.scenes.reduce((sum, s, index) => {
      const sceneNum = String(index + 1);
      if (sceneDurations && sceneDurations[sceneNum]) {
        return sum + Math.ceil((sceneDurations[sceneNum] / 1000) * fps);
      }
      return sum + Math.ceil((s.duration_ms / 1000) * fps);
    }, 0);
  }

  const config = PLATFORM_CONFIGS[platform] || PLATFORM_CONFIGS.full;
  return config.reduce((sum, s, index) => {
    const sceneNum = String(index + 1);
    if (sceneDurations && sceneDurations[sceneNum]) {
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

  const useStoryboard = storyboard?.scenes && storyboard.scenes.length > 0;

  let offset = 0;
  let timeline: {
    id: number;
    sceneId: string;
    segment: string;
    narration?: string;
    visual?: StoryboardVisual;
    durationFrames: number;
    startFrame: number;
    endFrame: number;
  }[];

  if (useStoryboard) {
    timeline = storyboard!.scenes.map((scene, index) => {
      const sceneNum = String(index + 1);
      let durationFrames: number;
      if (sceneDurations[sceneNum]) {
        durationFrames = Math.ceil((sceneDurations[sceneNum] / 1000) * fps);
      } else {
        durationFrames = Math.ceil((scene.duration_ms / 1000) * fps);
      }
      const startFrame = offset;
      offset += durationFrames;
      return {
        id: index + 1,
        sceneId: scene.id,
        segment: scene.segment,
        narration: scene.narration,
        visual: scene.visual,
        durationFrames,
        startFrame,
        endFrame: startFrame + durationFrames,
      };
    });
  } else {
    const config = PLATFORM_CONFIGS[platform] || PLATFORM_CONFIGS.full;
    timeline = config.map((scene, index) => {
      const sceneNum = String(index + 1);
      let durationFrames: number;
      if (sceneDurations[sceneNum]) {
        durationFrames = Math.ceil((sceneDurations[sceneNum] / 1000) * fps);
      } else {
        durationFrames = scene.duration * fps;
      }
      const startFrame = offset;
      offset += durationFrames;
      return {
        id: index + 1,
        sceneId: `scene-${index + 1}`,
        segment: scene.segment,
        durationFrames,
        startFrame,
        endFrame: startFrame + durationFrames,
      };
    });
  }

  const getAIClip = (sceneId: number) => aiClips.find((c) => c.sceneId === sceneId);

  return (
    <AbsoluteFill style={{ backgroundColor: colorScheme.background }}>
      {timeline.map((scene, index) => {
        const aiClip = getAIClip(scene.id);
        const isFirst = index === 0;
        const isLast = index === timeline.length - 1;

        return (
          <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationFrames}>
            <ContentFade
              durationFrames={scene.durationFrames}
              fadeIn={!isFirst}
              fadeOut={!isLast}
              fadeFrames={FADE_FRAMES}
            >
              {aiClip ? (
                <AIClipScene videoPath={aiClip.videoPath} provider={aiClip.provider} />
              ) : scene.visual?.type === "text_card" ? (
                <StoryboardScene
                  colorScheme={colorScheme}
                  visual={scene.visual}
                  segment={scene.segment}
                  sceneId={scene.sceneId}
                  durationFrames={scene.durationFrames}
                  isVertical={isVertical}
                />
              ) : DEFAULT_SCENE_COMPONENTS[scene.segment] ? (
                React.createElement(DEFAULT_SCENE_COMPONENTS[scene.segment], {
                  colorScheme,
                  animationStyle,
                  durationFrames: scene.durationFrames,
                  isVertical,
                })
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

const ContentFade: React.FC<{
  durationFrames: number;
  fadeIn: boolean;
  fadeOut: boolean;
  fadeFrames: number;
  children: React.ReactNode;
}> = ({ durationFrames, fadeIn, fadeOut, fadeFrames, children }) => {
  const frame = useCurrentFrame();

  let opacity = 1;

  if (fadeIn) {
    const fadeInOpacity = interpolate(frame, [0, fadeFrames], [0, 1], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
      easing: Easing.out(Easing.quad),
    });
    opacity = Math.min(opacity, fadeInOpacity);
  }

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
