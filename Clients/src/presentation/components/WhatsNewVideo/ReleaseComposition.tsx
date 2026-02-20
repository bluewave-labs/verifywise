import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { IntroScene } from "./scenes/IntroScene";
import { FeatureScene } from "./scenes/FeatureScene";
import { OutroScene } from "./scenes/OutroScene";
import { COLORS, SCENE_DURATIONS } from "./styles";
import { RELEASE_FEATURES } from "./releaseConfig";

export const ReleaseComposition: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background }}>
      <Audio
        src="/ambient-pad.mp3"
        volume={(f) => {
          const maxVolume = 0.585;
          const fadeIn = interpolate(f, [0, 2 * fps], [0, maxVolume], {
            extrapolateRight: "clamp",
          });
          const fadeOut = interpolate(
            f,
            [durationInFrames - 3 * fps, durationInFrames],
            [maxVolume, 0],
            { extrapolateLeft: "clamp" }
          );
          return Math.min(fadeIn, fadeOut);
        }}
        loop
      />

      <TransitionSeries>
        <TransitionSeries.Sequence
          durationInFrames={SCENE_DURATIONS.intro}
        >
          <IntroScene />
        </TransitionSeries.Sequence>

        {RELEASE_FEATURES.flatMap((feature) => [
          <TransitionSeries.Transition
            key={`t-${feature.number}`}
            presentation={fade()}
            timing={linearTiming({
              durationInFrames: SCENE_DURATIONS.transition,
            })}
          />,
          <TransitionSeries.Sequence
            key={feature.number}
            durationInFrames={SCENE_DURATIONS.feature}
          >
            <FeatureScene {...feature} />
          </TransitionSeries.Sequence>,
        ])}

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({
            durationInFrames: SCENE_DURATIONS.transition,
          })}
        />
        <TransitionSeries.Sequence
          durationInFrames={SCENE_DURATIONS.outro}
        >
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
