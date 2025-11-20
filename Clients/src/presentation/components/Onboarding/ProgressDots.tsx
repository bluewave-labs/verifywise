import React from "react";
import { Box } from "@mui/material";

interface ProgressDotsProps {
  totalSteps: number;
  currentStep: number;
}

const ProgressDots: React.FC<ProgressDotsProps> = ({ totalSteps, currentStep }) => {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {Array.from({ length: totalSteps }).map((_, index) => (
        <Box
          key={index}
          sx={{
            width: currentStep === index ? 48 : 16,
            height: 8,
            borderRadius: currentStep === index ? 4 : "50%",
            backgroundColor: currentStep === index ? "#13715B" : "rgba(0, 0, 0, 0.3)",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </Box>
  );
};

export default ProgressDots;
