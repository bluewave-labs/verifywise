import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../styles";

const fontFamily = '"Geist", system-ui, -apple-system, sans-serif';

type FeatureSceneProps = {
  number: string;
  category: string;
  title: string;
  description: string;
};

export const FeatureScene: React.FC<FeatureSceneProps> = ({
  number,
  category,
  title,
  description,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tagOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tagX = interpolate(frame, [5, 20], [-20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const barHeight = interpolate(frame, [8, 30], [0, 72], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
    delay: 15,
  });
  const titleY = interpolate(titleProgress, [0, 1], [30, 0]);

  const descOpacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const descY = interpolate(frame, [35, 55], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        fontFamily,
        padding: "0 160px",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          color: COLORS.tag,
          fontSize: 24,
          fontWeight: 400,
          letterSpacing: 5,
          textTransform: "uppercase",
          marginBottom: 32,
          opacity: tagOpacity,
          transform: `translateX(${tagX}px)`,
        }}
      >
        {number} / {category}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            width: 5,
            height: barHeight,
            backgroundColor: COLORS.primary,
            borderRadius: 2,
            flexShrink: 0,
          }}
        />

        <div
          style={{
            color: COLORS.white,
            fontSize: 80,
            fontWeight: 700,
            letterSpacing: -1.5,
            lineHeight: 1.15,
            opacity: titleProgress,
            transform: `translateY(${titleY}px)`,
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          color: COLORS.subtitle,
          fontSize: 50,
          fontWeight: 400,
          lineHeight: 1.5,
          marginLeft: 33,
          maxWidth: 1200,
          opacity: descOpacity,
          transform: `translateY(${descY}px)`,
        }}
      >
        {description}
      </div>
    </AbsoluteFill>
  );
};
