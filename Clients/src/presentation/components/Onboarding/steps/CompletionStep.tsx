import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { CheckCircle2 } from "lucide-react";
import { OnboardingStepProps } from "../../../../domain/interfaces/i.onboarding";

const CompletionStep: React.FC<OnboardingStepProps> = () => {
  return (
    <Stack spacing={4} alignItems="center" justifyContent="center" sx={{ minHeight: "400px" }}>
      <Box
        sx={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          backgroundColor: "#D1FAE5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "scaleIn 0.5s ease-out",
          "@keyframes scaleIn": {
            from: {
              transform: "scale(0)",
              opacity: 0,
            },
            to: {
              transform: "scale(1)",
              opacity: 1,
            },
          },
        }}
      >
        <CheckCircle2 size={48} color="#13715B" />
      </Box>

      <Stack spacing={2} alignItems="center">
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            fontSize: "28px",
            color: "#111827",
            textAlign: "center",
          }}
        >
          Congratulations!
        </Typography>

        <Typography
          sx={{
            fontSize: "16px",
            color: "#667085",
            textAlign: "center",
            maxWidth: "500px",
            lineHeight: 1.6,
          }}
        >
          You are ready to work with VerifyWise and manage your AI governance process
        </Typography>
      </Stack>

      <Box
        sx={{
          backgroundColor: "#F0FDF4",
          border: "1px solid #D1FAE5",
          borderRadius: "4px",
          padding: 3,
          width: "100%",
          maxWidth: "500px",
        }}
      >
        <Typography
          sx={{
            fontSize: "13px",
            color: "#13715B",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          Click "Finish" below to start exploring VerifyWise and begin your AI governance journey
        </Typography>
      </Box>
    </Stack>
  );
};

export default CompletionStep;
