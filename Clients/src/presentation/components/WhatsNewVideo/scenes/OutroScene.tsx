import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { COLORS } from "../styles";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
    delay: 5,
  });
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);

  const subtitleOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleY = interpolate(frame, [25, 45], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const urlOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lineWidth = interpolate(frame, [35, 65], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          color: COLORS.white,
          fontSize: 86,
          fontWeight: 700,
          letterSpacing: -2,
          opacity: titleProgress,
          transform: `translateY(${titleY}px)`,
        }}
      >
        VerifyWise 2.1
      </div>

      <div
        style={{
          width: lineWidth,
          height: 4,
          backgroundColor: COLORS.primary,
          marginTop: 28,
          borderRadius: 2,
        }}
      />

      <div
        style={{
          color: COLORS.subtitle,
          fontSize: 48,
          fontWeight: 400,
          marginTop: 28,
          letterSpacing: 6,
          textTransform: "uppercase",
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
        }}
      >
        Available now
      </div>

      <div
        style={{
          color: COLORS.primary,
          fontSize: 36,
          fontWeight: 400,
          marginTop: 24,
          letterSpacing: 1,
          opacity: urlOpacity,
        }}
      >
        verifywise.ai
      </div>
    </AbsoluteFill>
  );
};
