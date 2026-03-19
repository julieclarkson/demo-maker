import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Easing,
} from "remotion";

interface ColorScheme {
  background: string;
  accent: string;
  secondary: string;
  text: string;
  muted: string;
}

interface Visual {
  type: string;
  text: string;
  subtext?: string;
  style?: string;
  animation?: string;
}

interface Props {
  colorScheme: ColorScheme;
  visual: Visual;
  segment: string;
  sceneId: string;
  durationFrames: number;
  isVertical?: boolean;
}

export const StoryboardScene: React.FC<Props> = (props) => {
  switch (props.sceneId) {
    case "hook-1":
      return <HookIdentities {...props} />;
    case "context-1":
      return <MemoryFade {...props} />;
    case "demo-1":
      return <IDECapture {...props} />;
    case "demo-2":
      return <GenerateCards {...props} />;
    case "demo-3":
      return <LocalOnly {...props} />;
    case "result-1":
      return <BeforeAfter {...props} />;
    case "cta-1":
      return <ProductCTA {...props} />;
    default:
      return <GenericTextCard {...props} />;
  }
};

const HookIdentities: React.FC<Props> = ({ colorScheme, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labels = [
    { text: "Product Builder", delay: 10 },
    { text: "Vibe Coder", delay: 30 },
    { text: "Creative Technologist", delay: 50 },
  ];

  const blurStart = fps * 8;
  const blur = interpolate(frame, [blurStart, blurStart + 30], [0, 16], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const labelDim = interpolate(frame, [blurStart, blurStart + 30], [1, 0.15], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const questionScale = spring({
    frame: Math.max(0, frame - blurStart - 10),
    fps,
    from: 0.2,
    to: 1,
    config: { damping: 8, mass: 0.5 },
  });
  const questionOpacity = interpolate(
    frame,
    [blurStart + 10, blurStart + 30],
    [0, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colorScheme.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          filter: `blur(${blur}px)`,
          opacity: labelDim,
        }}
      >
        {labels.map((label, i) => {
          const scale = spring({
            frame: Math.max(0, frame - label.delay),
            fps,
            from: 0.4,
            to: 1,
            config: { damping: 9, mass: 0.5 },
          });
          const opacity = interpolate(
            frame,
            [label.delay, label.delay + 12],
            [0, 1],
            { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
          );
          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `scale(${scale})`,
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: isVertical ? 40 : 56,
                fontWeight: 700,
                color: i === 0 ? colorScheme.accent : i === 1 ? colorScheme.secondary : colorScheme.text,
                letterSpacing: -1,
              }}
            >
              {label.text}
            </div>
          );
        })}
      </AbsoluteFill>

      {frame >= blurStart + 10 && (
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: isVertical ? "0 40px" : "0 120px",
          }}
        >
          <div
            style={{
              opacity: questionOpacity,
              transform: `scale(${questionScale})`,
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: isVertical ? 44 : 68,
              fontWeight: 800,
              color: colorScheme.text,
              textAlign: "center",
              lineHeight: 1.2,
              letterSpacing: -2,
            }}
          >
            But where's the case study?
          </div>
          <div
            style={{
              opacity: interpolate(frame, [blurStart + 25, blurStart + 40], [0, 1], {
                extrapolateRight: "clamp",
                extrapolateLeft: "clamp",
              }),
              fontFamily: "system-ui",
              fontSize: isVertical ? 28 : 36,
              fontWeight: 500,
              color: colorScheme.muted,
              marginTop: 20,
              textAlign: "center",
            }}
          >
            Where's the marketing page?
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const MemoryFade: React.FC<Props> = ({ colorScheme, visual, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textScale = spring({
    frame,
    fps,
    from: 0.85,
    to: 1,
    config: { damping: 12 },
  });
  const textOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const fadeStart = fps * 4;
  const textBlur = interpolate(frame, [fadeStart, fadeStart + fps * 3], [0, 8], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const desat = interpolate(frame, [fadeStart, fadeStart + fps * 3], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colorScheme.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isVertical ? "0 40px" : "0 120px",
      }}
    >
      <div
        style={{
          filter: `blur(${textBlur}px)`,
          opacity: textOpacity,
          transform: `scale(${textScale})`,
        }}
      >
        <div
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: isVertical ? 44 : 64,
            fontWeight: 800,
            color: interpolateColor(desat, colorScheme.text, colorScheme.muted),
            textAlign: "center",
            lineHeight: 1.25,
            letterSpacing: -1.5,
          }}
        >
          {visual.text}
        </div>
        {visual.subtext && (
          <div
            style={{
              fontFamily: "system-ui",
              fontSize: isVertical ? 26 : 34,
              fontWeight: 500,
              color: colorScheme.muted,
              textAlign: "center",
              marginTop: 24,
              lineHeight: 1.4,
            }}
          >
            {visual.subtext}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

function interpolateColor(t: number, active: string, faded: string): string {
  return t > 0.5 ? active : faded;
}

const IDECapture: React.FC<Props> = ({ colorScheme, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowScale = spring({ frame, fps, from: 0.7, to: 1, config: { damping: 10, mass: 0.6 } });
  const windowOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const moments = [
    { label: "Architecture decision", frame: fps * 3, color: "#3B82F6", icon: "🏗" },
    { label: "Security risk handled", frame: fps * 7, color: "#EF4444", icon: "🔒" },
    { label: "Your answer captured", frame: fps * 11, color: "#10B981", icon: "✓" },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colorScheme.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isVertical ? "20px" : "40px 80px",
      }}
    >
      <div
        style={{
          opacity: windowOpacity,
          transform: `scale(${windowScale})`,
          width: isVertical ? "95%" : "85%",
          maxWidth: 1200,
        }}
      >
        {/* IDE window chrome */}
        <div
          style={{
            background: "#1E1E1E",
            borderRadius: "16px 16px 0 0",
            padding: "14px 20px",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#FF5F57" }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#FEBC2E" }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#28C840" }} />
          <div
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: "'SF Mono', Consolas, monospace",
              fontSize: 14,
              color: "#858585",
            }}
          >
            project/src/api.ts — Cursor
          </div>
        </div>

        {/* Editor + Chat panel */}
        <div style={{ display: "flex", background: "#252526", borderRadius: "0 0 16px 16px", overflow: "hidden" }}>
          {/* Code area */}
          <div style={{ flex: 1, padding: "28px 24px", borderRight: "1px solid #3C3C3C" }}>
            <div style={{ fontFamily: "'SF Mono', Consolas, monospace", fontSize: 16, lineHeight: 1.7 }}>
              {["export async function createUser(data) {", "  const hashed = await bcrypt.hash(data.password, 12);", "  const user = await db.users.create({", "    ...data,", "    password: hashed,", "  });", "  return sanitize(user);", "}"].map((line, i) => {
                const lineOpacity = interpolate(frame, [10 + i * 4, 18 + i * 4], [0, 1], {
                  extrapolateRight: "clamp",
                  extrapolateLeft: "clamp",
                });
                return (
                  <div key={i} style={{ opacity: lineOpacity, color: i === 0 ? "#569CD6" : i === 1 ? "#CE9178" : "#D4D4D4" }}>
                    {line}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat panel */}
          <div style={{ width: isVertical ? 200 : 360, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontFamily: "system-ui", fontSize: 14, color: "#858585", fontWeight: 600, borderBottom: "1px solid #3C3C3C", paddingBottom: 10 }}>
              Case Study Maker
            </div>
            {moments.map((m, i) => {
              const show = frame >= m.frame;
              const badgeScale = spring({
                frame: Math.max(0, frame - m.frame),
                fps,
                from: 0.3,
                to: 1,
                config: { damping: 8, mass: 0.5 },
              });
              const opacity = interpolate(frame, [m.frame, m.frame + 10], [0, 1], {
                extrapolateRight: "clamp",
                extrapolateLeft: "clamp",
              });
              if (!show) return null;
              return (
                <div
                  key={i}
                  style={{
                    opacity,
                    transform: `scale(${badgeScale})`,
                    background: `${m.color}20`,
                    border: `1px solid ${m.color}50`,
                    borderRadius: 10,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{m.icon}</span>
                  <span style={{ fontFamily: "system-ui", fontSize: 14, color: "#E0E0E0", fontWeight: 600 }}>
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const GenerateCards: React.FC<Props> = ({ colorScheme, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const typingChars = Math.min(
    "/generate".length,
    Math.floor(interpolate(frame, [10, 40], [0, "/generate".length], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    }))
  );
  const commandText = "/generate".slice(0, typingChars);
  const cursorBlink = Math.floor(frame / 15) % 2 === 0;

  const formats = [
    { name: "Portfolio Case Study", icon: "📋", color: colorScheme.accent, delay: fps * 2 },
    { name: "Marketing Page", icon: "🌐", color: colorScheme.secondary, delay: fps * 2.5 },
    { name: "Pitch Deck Text", icon: "📊", color: "#10B981", delay: fps * 3 },
  ];

  const selectedIndex = 0;
  const selectFrame = fps * 7;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colorScheme.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
        padding: isVertical ? "0 30px" : "0 80px",
      }}
    >
      {/* Command */}
      <div
        style={{
          fontFamily: "'SF Mono', Consolas, monospace",
          fontSize: isVertical ? 40 : 56,
          fontWeight: 700,
          color: colorScheme.accent,
          display: "flex",
          alignItems: "center",
        }}
      >
        <span style={{ color: colorScheme.muted, marginRight: 8 }}>$</span>
        {commandText}
        <span style={{ opacity: cursorBlink ? 1 : 0, color: colorScheme.accent, marginLeft: 2 }}>▋</span>
      </div>

      {/* Format cards */}
      <div
        style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          gap: isVertical ? 16 : 28,
          alignItems: "center",
        }}
      >
        {formats.map((f, i) => {
          const show = frame >= f.delay;
          const cardScale = spring({
            frame: Math.max(0, frame - f.delay),
            fps,
            from: 0.3,
            to: 1,
            config: { damping: 8, mass: 0.5 },
          });
          const isSelected = i === selectedIndex && frame >= selectFrame;
          const highlight = isSelected
            ? spring({ frame: Math.max(0, frame - selectFrame), fps, from: 1, to: 1.08, config: { damping: 10 } })
            : 1;

          if (!show) return null;
          return (
            <div
              key={i}
              style={{
                transform: `scale(${cardScale * highlight})`,
                background: isSelected ? `${f.color}12` : "#F9FAFB",
                border: `3px solid ${isSelected ? f.color : "#E5E7EB"}`,
                borderRadius: 20,
                padding: isVertical ? "24px 32px" : "36px 44px",
                textAlign: "center",
                boxShadow: isSelected ? `0 8px 32px ${f.color}25` : "0 4px 16px rgba(0,0,0,0.05)",
                minWidth: isVertical ? undefined : 240,
              }}
            >
              <div style={{ fontSize: isVertical ? 40 : 52 }}>{f.icon}</div>
              <div
                style={{
                  fontFamily: "system-ui",
                  fontSize: isVertical ? 18 : 22,
                  fontWeight: 700,
                  color: isSelected ? f.color : colorScheme.text,
                  marginTop: 16,
                }}
              >
                {f.name}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const LocalOnly: React.FC<Props> = ({ colorScheme, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const items = [
    { icon: "🔑", label: "API Keys", strikeFrame: 15, color: "#EF4444" },
    { icon: "☁️", label: "Cloud", strikeFrame: 35, color: "#EF4444" },
    { icon: "📁", label: "Local Folder", strikeFrame: -1, color: "#10B981" },
  ];

  const checkmarkFrame = 60;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colorScheme.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          gap: isVertical ? 24 : 48,
          alignItems: "center",
        }}
      >
        {items.map((item, i) => {
          const appear = spring({
            frame: Math.max(0, frame - i * 8),
            fps,
            from: 0.5,
            to: 1,
            config: { damping: 10 },
          });
          const isStruck = item.strikeFrame > 0 && frame >= item.strikeFrame;
          const strikeWidth = isStruck
            ? interpolate(frame, [item.strikeFrame, item.strikeFrame + 10], [0, 100], {
                extrapolateRight: "clamp",
                extrapolateLeft: "clamp",
              })
            : 0;
          const isLocal = item.strikeFrame === -1;
          const localGlow = isLocal && frame >= checkmarkFrame;
          const glowScale = localGlow
            ? spring({ frame: Math.max(0, frame - checkmarkFrame), fps, from: 0.8, to: 1.1, config: { damping: 7 } })
            : 1;

          return (
            <div
              key={i}
              style={{
                transform: `scale(${appear * glowScale})`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                opacity: isStruck ? 0.35 : 1,
              }}
            >
              <div
                style={{
                  width: isVertical ? 80 : 100,
                  height: isVertical ? 80 : 100,
                  borderRadius: isVertical ? 20 : 24,
                  background: localGlow ? `${item.color}15` : "#F9FAFB",
                  border: `3px solid ${localGlow ? item.color : isStruck ? "#D1D5DB" : "#E5E7EB"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 44,
                  position: "relative",
                  boxShadow: localGlow ? `0 8px 32px ${item.color}30` : "none",
                }}
              >
                {item.icon}
                {localGlow && (
                  <div
                    style={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      background: item.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      color: "white",
                      fontWeight: 800,
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>
              <div
                style={{
                  fontFamily: "system-ui",
                  fontSize: isVertical ? 20 : 24,
                  fontWeight: 700,
                  color: isStruck ? colorScheme.muted : colorScheme.text,
                  position: "relative",
                }}
              >
                {item.label}
                {isStruck && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: 0,
                      width: `${strikeWidth}%`,
                      height: 3,
                      background: "#EF4444",
                      borderRadius: 2,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const BeforeAfter: React.FC<Props> = ({ colorScheme, durationFrames, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const splitStart = fps * 6;
  const splitRatio = interpolate(frame, [splitStart, splitStart + fps * 2], [50, 30], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const beforeOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const afterDelay = fps * 3;
  const afterSlide = spring({
    frame: Math.max(0, frame - afterDelay),
    fps,
    from: 200,
    to: 0,
    config: { damping: 12 },
  });
  const afterOpacity = interpolate(frame, [afterDelay, afterDelay + 20], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  if (isVertical) {
    return (
      <AbsoluteFill style={{ backgroundColor: colorScheme.background, flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: beforeOpacity }}>
          <BeforePanel colorScheme={colorScheme} frame={frame} fps={fps} />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: afterOpacity, transform: `translateY(${afterSlide}px)` }}>
          <AfterPanel colorScheme={colorScheme} frame={frame} fps={fps} afterDelay={afterDelay} />
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: colorScheme.background }}>
      {/* Before panel */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: `${splitRatio}%`,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: beforeOpacity,
          borderRight: "2px solid #E5E7EB",
        }}
      >
        <BeforePanel colorScheme={colorScheme} frame={frame} fps={fps} />
      </div>

      {/* After panel */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: `${100 - splitRatio}%`,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: afterOpacity,
          transform: `translateX(${afterSlide}px)`,
        }}
      >
        <AfterPanel colorScheme={colorScheme} frame={frame} fps={fps} afterDelay={afterDelay} />
      </div>

      {/* Labels */}
      <div
        style={{
          position: "absolute",
          top: 48,
          left: 48,
          fontFamily: "system-ui",
          fontSize: 28,
          fontWeight: 700,
          color: colorScheme.muted,
          opacity: beforeOpacity,
        }}
      >
        BEFORE
      </div>
      <div
        style={{
          position: "absolute",
          top: 48,
          right: 48,
          fontFamily: "system-ui",
          fontSize: 28,
          fontWeight: 700,
          color: colorScheme.accent,
          opacity: afterOpacity,
        }}
      >
        AFTER
      </div>
    </AbsoluteFill>
  );
};

const BeforePanel: React.FC<{ colorScheme: ColorScheme; frame: number; fps: number }> = ({
  colorScheme,
  frame,
}) => {
  const cursorBlink = Math.floor(frame / 20) % 2 === 0;
  return (
    <div
      style={{
        width: "80%",
        maxWidth: 500,
        background: "#F9FAFB",
        borderRadius: 16,
        padding: "48px 36px",
        border: "2px solid #E5E7EB",
        minHeight: 300,
        display: "flex",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          fontFamily: "system-ui",
          fontSize: 20,
          color: "#D1D5DB",
          display: "flex",
          alignItems: "center",
        }}
      >
        Start writing your case study...
        <span style={{ opacity: cursorBlink ? 1 : 0, color: "#D1D5DB", marginLeft: 2, fontSize: 24 }}>|</span>
      </div>
    </div>
  );
};

const AfterPanel: React.FC<{ colorScheme: ColorScheme; frame: number; fps: number; afterDelay: number }> = ({
  colorScheme,
  frame,
  fps,
  afterDelay,
}) => {
  const pages = [
    { title: "Portfolio Case Study", color: colorScheme.accent, delay: afterDelay + 15, lines: 6 },
    { title: "Marketing Page", color: colorScheme.secondary, delay: afterDelay + 30, lines: 5 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "80%", maxWidth: 500 }}>
      {pages.map((page, i) => {
        const scale = spring({
          frame: Math.max(0, frame - page.delay),
          fps,
          from: 0.8,
          to: 1,
          config: { damping: 10 },
        });
        const opacity = interpolate(frame, [page.delay, page.delay + 12], [0, 1], {
          extrapolateRight: "clamp",
          extrapolateLeft: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              opacity,
              transform: `scale(${scale})`,
              background: "white",
              borderRadius: 16,
              padding: "24px 28px",
              border: `2px solid ${page.color}40`,
              boxShadow: `0 4px 20px ${page.color}15`,
            }}
          >
            <div
              style={{
                fontFamily: "system-ui",
                fontSize: 18,
                fontWeight: 700,
                color: page.color,
                marginBottom: 16,
              }}
            >
              {page.title}
            </div>
            {Array.from({ length: page.lines }).map((_, j) => (
              <div
                key={j}
                style={{
                  height: 8,
                  background: j === 0 ? `${page.color}30` : "#F3F4F6",
                  borderRadius: 4,
                  marginBottom: 8,
                  width: `${70 + Math.sin(j * 2) * 25}%`,
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

const ProductCTA: React.FC<Props> = ({ colorScheme, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, from: 0.3, to: 1, config: { damping: 7, mass: 0.6 } });
  const titleOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });

  const subtitleOpacity = interpolate(frame, [40, 65], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const subtitleY = spring({ frame: Math.max(0, frame - 40), fps, from: 30, to: 0, config: { damping: 12 } });

  const badgeDelay = 80;
  const badges = [
    { text: "Cursor", icon: "⚡" },
    { text: "Claude Desktop", icon: "🤖" },
    { text: "GitHub", icon: "⭐" },
  ];

  const urlOpacity = interpolate(frame, [140, 170], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const gradientAngle = interpolate(frame, [0, 300], [135, 225], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, ${colorScheme.background} 0%, #EFF6FF 50%, #F5F3FF 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: isVertical ? 64 : 96,
          fontWeight: 800,
          background: `linear-gradient(135deg, ${colorScheme.accent}, ${colorScheme.secondary})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: -3,
          textAlign: "center",
        }}
      >
        Case Study Maker
      </div>

      <div
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          fontFamily: "system-ui",
          fontSize: isVertical ? 28 : 38,
          color: colorScheme.text,
          fontWeight: 500,
          textAlign: "center",
        }}
      >
        Free on GitHub. Start capturing what you built.
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          gap: isVertical ? 12 : 20,
          marginTop: 12,
        }}
      >
        {badges.map((badge, i) => {
          const delay = badgeDelay + i * 15;
          const scale = spring({
            frame: Math.max(0, frame - delay),
            fps,
            from: 0,
            to: 1,
            config: { damping: 8, mass: 0.5 },
          });
          return (
            <div
              key={i}
              style={{
                transform: `scale(${scale})`,
                background: "white",
                borderRadius: 14,
                padding: "14px 28px",
                border: "2px solid #E5E7EB",
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 22 }}>{badge.icon}</span>
              <span style={{ fontFamily: "system-ui", fontSize: 20, fontWeight: 700, color: colorScheme.text }}>
                {badge.text}
              </span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          opacity: urlOpacity,
          fontFamily: "'SF Mono', Consolas, monospace",
          fontSize: 20,
          color: colorScheme.accent,
          fontWeight: 600,
          marginTop: 8,
        }}
      >
        github.com/julieclarkson/case-study-maker
      </div>
    </AbsoluteFill>
  );
};

const GenericTextCard: React.FC<Props> = ({ colorScheme, visual, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textScale = spring({ frame, fps, from: 0.7, to: 1, config: { damping: 10, mass: 0.6 } });
  const textOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subtextOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const subtextSlide = spring({ frame: Math.max(0, frame - 18), fps, from: 30, to: 0, config: { damping: 12 } });

  const barWidth = spring({ frame: Math.max(0, frame - 5), fps, from: 0, to: 120, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colorScheme.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isVertical ? "0 40px" : "0 120px",
      }}
    >
      <div style={{ width: barWidth, height: 4, backgroundColor: colorScheme.accent, borderRadius: 2, marginBottom: 40, opacity: textOpacity }} />
      <div
        style={{
          opacity: textOpacity,
          transform: `scale(${textScale})`,
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: isVertical ? 48 : 72,
          fontWeight: 800,
          color: colorScheme.text,
          textAlign: "center",
          lineHeight: 1.15,
          maxWidth: "80%",
          letterSpacing: -1.5,
        }}
      >
        {visual.text}
      </div>
      {visual.subtext && (
        <div
          style={{
            opacity: subtextOpacity,
            transform: `translateY(${subtextSlide}px)`,
            fontFamily: "system-ui",
            fontSize: isVertical ? 24 : 32,
            fontWeight: 500,
            color: colorScheme.muted,
            textAlign: "center",
            maxWidth: "70%",
            marginTop: 28,
            lineHeight: 1.5,
          }}
        >
          {visual.subtext}
        </div>
      )}
    </AbsoluteFill>
  );
};
