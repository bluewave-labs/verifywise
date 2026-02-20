import { Player } from "@remotion/player";
import { ReleaseComposition } from "./ReleaseComposition";

interface VideoPlayerProps {
  durationInFrames: number;
  fps: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  durationInFrames,
  fps,
}) => {
  return (
    <Player
      component={ReleaseComposition}
      durationInFrames={durationInFrames}
      compositionWidth={1920}
      compositionHeight={1080}
      fps={fps}
      autoPlay
      style={{
        width: 800,
        height: 450,
      }}
      controls={false}
    />
  );
};
