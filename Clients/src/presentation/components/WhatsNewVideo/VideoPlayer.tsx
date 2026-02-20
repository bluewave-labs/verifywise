import { Player } from "@remotion/player";
import { Play } from "lucide-react";
import { ReleaseComposition } from "./ReleaseComposition";

interface VideoPlayerProps {
  durationInFrames: number;
  fps: number;
}

const PlayPoster: React.FC = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0a0a0a",
      cursor: "pointer",
    }}
  >
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        backgroundColor: "rgba(19, 113, 91, 0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.2s",
      }}
    >
      <Play size={36} color="#ffffff" fill="#ffffff" strokeWidth={0} />
    </div>
  </div>
);

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
      clickToPlay
      renderPoster={() => <PlayPoster />}
      showPosterWhenUnplayed
      style={{
        width: 800,
        height: 450,
      }}
      controls
    />
  );
};
