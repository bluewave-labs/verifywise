import React, { useState, useCallback, Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import { X } from "lucide-react";
import { FPS, SCENE_DURATIONS } from "./styles";
import { RELEASE_VERSION, RELEASE_FEATURES } from "./releaseConfig";

// Lazy-load the entire player + composition bundle together
const LazyVideoPlayer = React.lazy(() =>
  import("./VideoPlayer").then((mod) => ({ default: mod.VideoPlayer }))
);

// Duration auto-calculated from feature count
const featureCount = RELEASE_FEATURES.length;
const transitionCount = featureCount + 1; // between intro→features and features→outro
const TOTAL_DURATION =
  SCENE_DURATIONS.intro +
  featureCount * SCENE_DURATIONS.feature +
  SCENE_DURATIONS.outro -
  transitionCount * SCENE_DURATIONS.transition;

interface WhatsNewVideoModalProps {
  onClose: () => void;
}

export const WhatsNewVideoModal: React.FC<WhatsNewVideoModalProps> = ({
  onClose,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        animation: isClosing
          ? "fadeOut 0.3s ease-out"
          : "fadeIn 0.3s ease-in",
        "@keyframes fadeOut": {
          from: { opacity: 1 },
          to: { opacity: 0 },
        },
        "@keyframes fadeIn": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      {/* Close button */}
      <Box
        onClick={handleClose}
        sx={{
          position: "absolute",
          top: 24,
          right: 24,
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          borderRadius: "50%",
          transition: "background-color 0.2s",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        <X size={24} color="#ffffff" strokeWidth={1.5} />
      </Box>

      {/* Title */}
      <Box
        sx={{
          color: "#ffffff",
          fontSize: 24,
          fontWeight: 600,
          marginBottom: 3,
          letterSpacing: -0.5,
        }}
      >
        What's new in v{RELEASE_VERSION}
      </Box>

      {/* Player container */}
      <Box
        sx={{
          width: 800,
          height: 450,
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
        }}
      >
        <Suspense
          fallback={
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#0a0a0a",
              }}
            >
              <CircularProgress sx={{ color: "#13715B" }} />
            </Box>
          }
        >
          <LazyVideoPlayer
            durationInFrames={TOTAL_DURATION}
            fps={FPS}
          />
        </Suspense>
      </Box>
    </Box>
  );
};
