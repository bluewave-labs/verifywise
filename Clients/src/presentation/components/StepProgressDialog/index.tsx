import { useState, useEffect, useRef } from "react";
import { Box, Typography, LinearProgress, Dialog } from "@mui/material";
import { palette } from "../../themes/palette";

export interface ProgressStep {
  label: string;
  progress: number;
}

interface StepProgressDialogProps {
  open: boolean;
  title: string;
  steps: ProgressStep[];
  /** Time in ms between step transitions. Default 2200. */
  interval?: number;
}

export function StepProgressDialog({
  open,
  title,
  steps,
  interval = 2200,
}: StepProgressDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) =>
          prev < steps.length - 1 ? prev + 1 : prev
        );
      }, interval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, steps.length, interval]);

  const step = steps[currentStep] ?? steps[0];

  return (
    <Dialog
      open={open}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "8px",
            p: "24px 28px",
            minWidth: 400,
            maxWidth: 460,
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          },
        },
      }}
    >
      <Typography
        sx={{
          fontSize: "15px",
          fontWeight: 600,
          color: palette.text.primary,
          mb: "4px",
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontSize: "13px",
          color: palette.text.tertiary,
          mb: "20px",
        }}
      >
        {step.label}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={step.progress}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: palette.border.light,
          "& .MuiLinearProgress-bar": {
            borderRadius: 3,
            background: "linear-gradient(90deg, #13715B 0%, #1a9e7a 100%)",
            transition: "transform 0.8s ease",
          },
        }}
      />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: "8px",
        }}
      >
        <Typography sx={{ fontSize: "12px", color: palette.text.accent }}>
          Step {currentStep + 1} of {steps.length}
        </Typography>
        <Typography sx={{ fontSize: "12px", color: palette.text.accent }}>
          {step.progress}%
        </Typography>
      </Box>
    </Dialog>
  );
}
