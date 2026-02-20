import { useEffect, useRef } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { ReleaseComposition } from "./ReleaseComposition";

interface VideoPlayerProps {
  durationInFrames: number;
  fps: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  durationInFrames,
  fps,
}) => {
  const playerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    // Explicitly play after mount — more reliable than autoPlay
    const timer = setTimeout(() => {
      playerRef.current?.play();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Player
      ref={playerRef}
      component={ReleaseComposition}
      durationInFrames={durationInFrames}
      compositionWidth={1920}
      compositionHeight={1080}
      fps={fps}
      autoPlay
      clickToPlay
      style={{
        width: 800,
        height: 450,
      }}
      controls
    />
  );
};
