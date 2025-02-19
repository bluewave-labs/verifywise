/**
 * Progress bar display component for calculating the status of completed actions in fields.
 *
 * @component
 * @param {ProgressBarProps} props - The properties for the ProgressBar component.
 * @param {string} props.progress - The progress is how full the indicator is in string format.
 * @returns {JSX.Element} The rendered ProgressBar component.
 */

import { Slider, Stack, useTheme } from "@mui/material";
import { FC } from "react";

interface ProgressBarProps {
  progress: string | null;
  bgColor?: string;
}

const ProgressBar: FC<ProgressBarProps> = ({
  progress = "",
  bgColor = "#4C7DE7",
}) => {
  const theme = useTheme();
  const progressCount = (progressString: string): number => {
    // Function to calculate a number showing how full the indicator is
    const [completed, total] = progressString.split("/").map(Number); // Getting values ​​from a slash separated string. The first value shows how full it is, the second is the total value.
    if (Number.isNaN(completed) || Number.isNaN(total)) {
      throw new Error(
        `Invalid progress format. Expected 'number/number', got: ${progressString}`
      );
    }
    if (total === 0) {
      throw new Error("Total cannot be zero");
    }
    if (completed < 0 || total < 0) {
      throw new Error("Progress values cannot be negative");
    }
    if (completed > total) {
      throw new Error("Completed value cannot exceed total");
    }
    return completed / total;
  };
  const value =
    progress && progress.split("/")[1] !== "0"
      ? progressCount(progress) * 100
      : 0; // Calculating the percentage of how full the indicator is

  return (
    <Stack
      direction="row"
      sx={{
        "& .MuiSlider-track": {
          backgroundColor: bgColor,
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
