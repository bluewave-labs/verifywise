import { Slider, Stack, useTheme } from "@mui/material";
import { FC, useCallback } from "react";

interface ProgressBarProps {
  progress: string | null;
}

const ProgressBar: FC<ProgressBarProps> = ({ progress }) => {
  const theme = useTheme();

  const progressCount = (progressString: string): number => {
    const [completed, total] = progressString.split("/").map(Number);
    if (Number.isNaN(completed) || Number.isNaN(total)) {
      return 0;
    }
    if (total === 0) {
      return 0;
    }
    if (completed < 0 || total < 0) {
      return 0;
    }
    if (completed > total) {
      return 0;
    }
    return completed / total;
  };

  const value =
    progress && progress !== "" && progress.split("/")[1] !== "0"
      ? progressCount(progress) * 100
      : 0;

  const getProgressColor = useCallback((value: number) => {
    if (value <= 10) return "#FF4500"; // 0-10%
    if (value <= 20) return "#FF4500"; // 11-20%
    if (value <= 30) return "#FFA500"; // 21-30%
    if (value <= 40) return "#FFD700"; // 31-40%
    if (value <= 50) return "#E9F14F"; // 41-50%
    if (value <= 60) return "#CDDD24"; // 51-60%
    if (value <= 70) return "#64E730"; // 61-70%
    if (value <= 80) return "#32CD32"; // 71-80%
    if (value <= 90) return "#228B22"; // 81-90%
    return "#008000"; // 91-100%
  }, []);

  return (
    <Stack
      direction="row"
      sx={{
        "& .MuiSlider-track": {
          backgroundColor: getProgressColor(value),
          display: !value ? "none" : "block",
        },
        "& .MuiSlider-thumb": {
          display: "none",
        },
        "& .MuiSlider-rail": {
          opacity: 1,
        },
        "& .MuiSlider-root": {
          p: 0,
        },
      }}
    >
      <Slider
        value={value}
        sx={{
          cursor: "auto",
          height: 8,
          border: "none",
          color: theme.palette.border.light,
        }}
      />
    </Stack>
  );
};

export default ProgressBar;
