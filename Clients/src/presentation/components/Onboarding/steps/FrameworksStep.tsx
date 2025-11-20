import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { OnboardingStepProps } from "../../../../domain/interfaces/i.onboarding";
import Illustration from "../Illustrations";
import { IllustrationType } from "../../../../domain/enums/onboarding.enum";
import { Shield, FileText, Scale } from "lucide-react";

const FrameworksStep: React.FC<OnboardingStepProps> = () => {
  const frameworks = [
    {
      name: "EU AI Act",
      icon: <Scale size={20} />,
      description: "Comply with the European Union's comprehensive AI regulation framework.",
      color: "#3B82F6",
    },
    {
      name: "ISO 42001",
      icon: <Shield size={20} />,
      description: "Meet international standards for AI management systems and best practices.",
      color: "#8B5CF6",
    },
    {
      name: "ISO 27001",
      icon: <FileText size={20} />,
      description: "Ensure information security management for your AI systems and data.",
      color: "#10B981",
    },
  ];

  return (
    <Stack spacing={4}>
      <Illustration type={IllustrationType.GEOMETRIC_SHAPES} />

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
          Apply Compliance Frameworks
        </Typography>
        <Typography
          sx={{
            fontSize: "14px",
            color: "#667085",
            marginBottom: 3,
            lineHeight: 1.6,
          }}
        >
          Map your projects to regulations like EU AI Act, ISO 42001, and ISO 27001 to ensure comprehensive compliance.
        </Typography>
      </Box>

      <Stack spacing={2}>
        {frameworks.map((framework, index) => (
          <Box
            key={index}
            sx={{
              padding: 3,
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              display: "flex",
              gap: 2,
              transition: "all 0.2s",
              "&:hover": {
                borderColor: framework.color,
                boxShadow: `0 0 0 3px ${framework.color}15`,
              },
            }}
          >
            <Box
              sx={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                backgroundColor: `${framework.color}15`,
                color: framework.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {framework.icon}
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: 0.5,
                }}
              >
                {framework.name}
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>
                {framework.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>

      <Box
        sx={{
          backgroundColor: "#FEF3C7",
          border: "1px solid #FDE68A",
          borderRadius: "8px",
          padding: 2,
        }}
      >
        <Typography sx={{ fontSize: "12px", color: "#92400E" }}>
          <strong>Tip:</strong> You can map a single project to multiple frameworks to meet various regulatory requirements simultaneously.
        </Typography>
      </Box>
    </Stack>
  );
};

export default FrameworksStep;
