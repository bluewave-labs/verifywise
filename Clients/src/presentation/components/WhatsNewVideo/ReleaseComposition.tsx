import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { IntroScene } from "./scenes/IntroScene";
import { FeatureScene } from "./scenes/FeatureScene";
import { OutroScene } from "./scenes/OutroScene";
import { COLORS, SCENE_DURATIONS } from "./styles";

const FEATURES = [
  {
    number: "01",
    category: "Detection",
    title: "Shadow AI detection",
    description: "Discover unauthorized AI tool usage across the organization",
  },
  {
    number: "02",
    category: "Discovery",
    title: "AI agent discovery & inventory",
    description: "Catalog and monitor AI agents org-wide",
  },
  {
    number: "03",
    category: "Evaluation",
    title: "Law-aware bias audit module",
    description: "Bias auditing for LLM evaluations with legal awareness",
  },
  {
    number: "04",
    category: "Plugin",
    title: "Jira integration plugin",
    description: "Connect your AI governance workflow directly to Jira",
  },
  {
    number: "05",
    category: "Plugin",
    title: "Model inventory lifecycle plugin",
    description: "Track and manage the full lifecycle of your AI models",
  },
  {
    number: "06",
    category: "Plugin",
    title: "Dataset bulk upload plugin",
    description: "Upload and manage evaluation datasets in bulk",
  },
  {
    number: "07",
    category: "Detection",
    title: "Extended AI detection",
    description: "Now covers workflows, containers, and configs",
  },
  {
    number: "08",
    category: "Governance",
    title: "Lifecycle initialization wizard",
    description: "Shadow AI governance wizard for lifecycle setup",
  },
];

export const ReleaseComposition: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background }}>
      <Audio
        src="/ambient-pad.mp3"
        volume={(f) => {
          const maxVolume = 0.15;
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

        {FEATURES.flatMap((feature) => [
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
