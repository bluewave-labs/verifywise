import { Composition } from "remotion";
import { AllFeaturesVideo } from "./compositions/AllFeaturesVideo";
import { DemoVideo } from "./demo/DemoVideo";

export const RemotionRoot = () => {
  // AllFeaturesVideo: intro (150) + 13 sections (200 each) + outro (210) = 2960 frames
  // At 30fps = 99 seconds (about 1:39)

  // DemoVideo (synced with Piper narration):
  // Intro (90) + Problem (150) + Solution (120) +
  // 5 Use Cases × (Title 90 + Demo 240) = 1650 +
  // Value Prop (120) + Outro (120) = 2250 frames
  // At 30fps = 75 seconds (~1:15)

  return (
    <>
      <Composition
        id="AllFeaturesVideo"
        component={AllFeaturesVideo}
        durationInFrames={2960}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="DemoVideo"
        component={DemoVideo}
        durationInFrames={2250}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
