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

const STEPS = [
  { label: "Capture", icon: "📸", startFrame: 25, color: "#3B82F6" },
  { label: "Narrate", icon: "🎙", startFrame: 90, color: "#8B5CF6" },
  { label: "Render", icon: "🎬", startFrame: 155, color: "#EC4899" },
  { label: "Export", icon: "📦", startFrame: 220, color: "#F59E0B" },
  { label: "Publish", icon: "🚀", startFrame: 285, color: "#6366F1" },
];

export const WorkflowScene: React.FC<Props> = ({ colorScheme, durationFrames, isVertical = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title zooms in
  const titleScale = spring({ frame, fps, from: 0.6, to: 1, config: { damping: 10 } });
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colorScheme.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 36px 8% 36px",
      }}
    >
      {/* Title */}
      <div
        style={{
          fontFamily: "system-ui",
          fontSize: 52,
          fontWeight: 800,
          color: colorScheme.text,
          marginBottom: 56,
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
        }}
      >
        From code to video. Automatically.
      </div>

      {/* Pipeline — bigger nodes with vibrant colors */}
      <div style={{
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        gap: isVertical ? 12 : 18,
        alignItems: isVertical ? "center" : "flex-start",
        flexWrap: isVertical ? "nowrap" : "nowrap",
      }}>
        {STEPS.map((step, i) => {
          const isActive = frame >= step.startFrame;
          const bounceScale = spring({
            frame: Math.max(0, frame - step.startFrame),
            fps,
            from: 0.2,
            to: 1,
            config: { damping: 7, mass: 0.5 },
          });
          // Pulse after activation
          const pulse = isActive ? interpolate(
            frame,
            [step.startFrame + 20, step.startFrame + 35, step.startFrame + 50],
            [1, 1.1, 1],
            { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
          ) : 1;

          const lineProgress = i < STEPS.length - 1
            ? interpolate(
                frame,
                [step.startFrame + 10, step.startFrame + 35],
                [0, 1],
                { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
              )
            : 0;

          return (
            <React.Fragment key={step.label}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 14,
                  transform: `scale(${isActive ? bounceScale * pulse : 0.85})`,
                  opacity: isActive ? 1 : 0.15,
                }}
              >
                {/* Node */}
                <div
                  style={{
                    width: isVertical ? 88 : 116,
                    height: isVertical ? 88 : 116,
                    borderRadius: isVertical ? 22 : 28,
                    background: isActive
                      ? `linear-gradient(135deg, ${step.color}, ${step.color}CC)`
                      : "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 56,
                    boxShadow: isActive ? `0 10px 40px ${step.color}35` : "none",
                    border: `3px solid ${isActive ? step.color : "#E5E7EB"}`,
                  }}
                >
                  {step.icon}
                </div>

                <div
                  style={{
                    fontFamily: "system-ui",
                    fontSize: 20,
                    fontWeight: 700,
                    color: isActive ? colorScheme.text : colorScheme.muted,
                  }}
                >
                  {step.label}
                </div>
              </div>

              {/* Connecting line — animated fill */}
              {i < STEPS.length - 1 && (
                <div
                  style={isVertical ? {
                    width: 5,
                    height: 20,
                    borderRadius: 3,
                    background: `linear-gradient(180deg, ${step.color} ${lineProgress * 100}%, #E5E7EB ${lineProgress * 100}%)`,
                  } : {
                    width: 32,
                    height: 5,
                    marginTop: 56,
                    borderRadius: 3,
                    background: `linear-gradient(90deg, ${step.color} ${lineProgress * 100}%, #E5E7EB ${lineProgress * 100}%)`,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
