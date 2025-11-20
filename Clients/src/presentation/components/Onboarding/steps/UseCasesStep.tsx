import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { OnboardingStepProps } from "../../../../domain/interfaces/i.onboarding";
import Illustration from "../Illustrations";
import { IllustrationType } from "../../../../domain/enums/onboarding.enum";

const UseCasesStep: React.FC<OnboardingStepProps> = () => {
  return (
    <Stack spacing={4}>
      <Illustration type={IllustrationType.FLOW_DIAGRAM} />

      <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            fontSize: "24px",
            color: "#111827",
            marginBottom: 1,
          }}
        >
          Manage Your AI Use Cases
        </Typography>
        <Typography
          sx={{
            fontSize: "14px",
            color: "#667085",
            marginBottom: 3,
            lineHeight: 1.6,
          }}
        >
          Create and track AI projects, assign teams, and monitor compliance status across all your initiatives.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 2,
        }}
      >
        {[
          {
            title: "Create Use Cases",
            description: "Document your AI projects with detailed information about goals, teams, and timelines.",
          },
          {
            title: "Assign Teams",
            description: "Collaborate with team members by assigning owners and stakeholders to each project.",
          },
          {
            title: "Track Status",
            description: "Monitor progress from initiation to completion with real-time status updates.",
          },
          {
            title: "Ensure Compliance",
            description: "Link projects to relevant frameworks and ensure regulatory requirements are met.",
          },
        ].map((feature, index) => (
          <Box
            key={index}
            sx={{
              padding: 3,
              backgroundColor: "#F9FAFB",
              borderRadius: "8px",
              borderLeft: "4px solid #13715B",
            }}
          >
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#111827",
                marginBottom: 0.5,
              }}
            >
              {feature.title}
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>
              {feature.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Stack>
  );
};

export default UseCasesStep;
