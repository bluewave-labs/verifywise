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

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
    delay: 5,
  });

  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);
  const titleOpacity = titleProgress;

  const subtitleOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleY = interpolate(frame, [25, 45], [15, 0], {
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
          textAlign: "center",
          padding: "0 80px",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        VerifyWise AI Governance Platform
      </div>

      <div
        style={{
          color: COLORS.subtitle,
          fontSize: 48,
          fontWeight: 400,
          marginTop: 20,
          letterSpacing: 8,
          textTransform: "uppercase",
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
        }}
      >
        Version 2.1
      </div>

      <div
        style={{
          width: lineWidth,
          height: 4,
          backgroundColor: COLORS.primary,
          marginTop: 36,
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};
