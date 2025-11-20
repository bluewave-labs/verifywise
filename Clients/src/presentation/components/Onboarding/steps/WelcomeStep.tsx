import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { OnboardingStepProps } from "../../../../domain/interfaces/i.onboarding";
import onboardingBanner from "../../../assets/onboarding-banner.svg";

const WELCOME_FEATURES = [
  "How to manage AI use cases and projects",
  "Applying compliance frameworks like EU AI Act",
  "Tracking and mitigating AI risks",
  "Setting up your organization for success",
] as const;

const WelcomeStep: React.FC<OnboardingStepProps> = () => {
  return (
    <Stack spacing={4} alignItems="center">
      <Box
        component="img"
        src={onboardingBanner}
        alt="Onboarding"
        sx={{
          width: "100%",
          height: "auto",
          maxHeight: "200px",
          borderRadius: "8px",
          objectFit: "cover",
        }}
      />

      <Box textAlign="center">
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            fontSize: "28px",
            color: "#13715B",
            marginBottom: 2,
          }}
        >
          Welcome to VerifyWise
        </Typography>
        <Typography
          sx={{
            fontSize: "15px",
            color: "#667085",
            maxWidth: "600px",
            lineHeight: 1.6,
          }}
        >
          VerifyWise is your AI governance and compliance platform. In 3 minutes, we'll help you get started with managing AI risks, compliance frameworks, and building trust.
        </Typography>
      </Box>

      <Box
        sx={{
          backgroundColor: "#F0FDF4",
          border: "1px solid #D1FAE5",
          borderRadius: "8px",
          padding: 3,
          width: "100%",
        }}
      >
        <Typography
          sx={{
            fontSize: "13px",
            color: "#13715B",
            fontWeight: 500,
            marginBottom: 1,
          }}
        >
          What you'll learn:
        </Typography>
        <Stack spacing={1} sx={{ paddingLeft: 2 }}>
          {WELCOME_FEATURES.map((item, index) => (
            <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#13715B",
                }}
              />
              <Typography sx={{ fontSize: "13px", color: "#344054" }}>
                {item}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
};

export default WelcomeStep;
