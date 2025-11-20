import React, { useState, useEffect } from "react";
import { Box, Typography, Stack, FormControl, Checkbox, FormControlLabel } from "@mui/material";
import { OnboardingStepProps } from "../../../../domain/interfaces/i.onboarding";
import Illustration from "../Illustrations";
import { IllustrationType } from "../../../../domain/enums/onboarding.enum";
import { DEMO_PROJECT_BANNER } from "../onboardingConstants";
import Select from "../../../components/Inputs/Select";
import useFrameworks from "../../../../application/hooks/useFrameworks";
import { Framework } from "../../../../domain/types/Framework";

const SampleProjectStep: React.FC<OnboardingStepProps> = ({
  sampleProject,
  updateSampleProject,
}) => {
  const { allFrameworks } = useFrameworks({ listOfFrameworks: [] });
  const [selectedFrameworks, setSelectedFrameworks] = useState<number[]>(
    sampleProject?.selectedFrameworks || []
  );

  // Handle use case selection
  const handleUseCaseChange = (event: any) => {
    updateSampleProject?.({ useCaseName: event.target.value });
  };

  // Handle framework checkbox changes
  const handleFrameworkToggle = (frameworkId: number) => {
    const newSelectedFrameworks = selectedFrameworks.includes(frameworkId)
      ? selectedFrameworks.filter((id) => id !== frameworkId)
      : [...selectedFrameworks, frameworkId];

    setSelectedFrameworks(newSelectedFrameworks);
    updateSampleProject?.({ selectedFrameworks: newSelectedFrameworks });
  };

  useEffect(() => {
    if (sampleProject?.selectedFrameworks) {
      setSelectedFrameworks(sampleProject.selectedFrameworks);
    }
  }, [sampleProject?.selectedFrameworks]);

  const hasRequiredSelections =
    sampleProject?.useCaseName && selectedFrameworks.length > 0;

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
          Create Your First Demo Project
        </Typography>
        <Typography
          sx={{
            fontSize: "14px",
            color: "#667085",
            marginBottom: 2,
            lineHeight: 1.6,
          }}
        >
          Let's create a sample project to explore VerifyWise features hands-on.
        </Typography>

        {/* Demo Project Banner */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            padding: 2,
            backgroundColor: "#FEF3C7",
            border: "1px solid #FDE68A",
            borderRadius: "8px",
          }}
        >
          <Typography sx={{ fontSize: "18px" }}>{DEMO_PROJECT_BANNER.icon}</Typography>
          <Typography sx={{ fontSize: "13px", color: "#92400E", fontWeight: 500 }}>
            {DEMO_PROJECT_BANNER.message}
          </Typography>
        </Box>
      </Box>

      <Stack spacing={4}>
        {/* Use Case Selection */}
        <FormControl fullWidth required>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#344054",
              marginBottom: 1,
            }}
          >
            Select a use case template <span style={{ color: "#DC2626" }}>*</span>
          </Typography>
          <Select
            id="use-case-select"
            label=""
            value={sampleProject?.useCaseName || ""}
            onChange={handleUseCaseChange}
            items={[
              { _id: "demo-chatbot", name: "AI Chatbot for Customer Support" },
              { _id: "demo-analytics", name: "Predictive Analytics System" },
              { _id: "demo-cv", name: "Computer Vision for Quality Control" },
              { _id: "demo-nlp", name: "Document Processing with NLP" },
              { _id: "demo-recommendation", name: "Recommendation Engine" },
            ]}
            sx={{ width: "100%" }}
          />
          <Typography sx={{ fontSize: "12px", color: "#6B7280", marginTop: 1 }}>
            This will be the name of your demo project
          </Typography>
        </FormControl>

        {/* Framework Selection */}
        <FormControl required>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#344054",
              marginBottom: 2,
            }}
          >
            Select framework(s) to apply <span style={{ color: "#DC2626" }}>*</span>
          </Typography>

          <Stack spacing={1.5}>
            {allFrameworks?.map((framework: Framework) => (
              <FormControlLabel
                key={framework.id}
                control={
                  <Checkbox
                    checked={selectedFrameworks.includes(Number(framework.id))}
                    onChange={() => handleFrameworkToggle(Number(framework.id))}
                    sx={{
                      color: "#D0D5DD",
                      "&.Mui-checked": {
                        color: "#13715B",
                      },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ fontSize: "13px", color: "#111827", fontWeight: 500 }}>
                      {framework.name}
                    </Typography>
                    <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                      {framework.description || "Compliance framework for AI governance"}
                    </Typography>
                  </Box>
                }
                sx={{
                  margin: 0,
                  padding: 2,
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  "&:hover": {
                    backgroundColor: "#F9FAFB",
                  },
                }}
              />
            ))}
          </Stack>

          <Typography sx={{ fontSize: "12px", color: "#6B7280", marginTop: 1 }}>
            You can select multiple frameworks. At least one is required.
          </Typography>
        </FormControl>

        {/* Demo Risks Info */}
        <Box
          sx={{
            padding: 3,
            backgroundColor: "#F0FDF4",
            border: "1px solid #D1FAE5",
            borderRadius: "8px",
          }}
        >
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#13715B",
              marginBottom: 1,
            }}
          >
            What's included in your demo project:
          </Typography>
          <Stack spacing={0.5} sx={{ paddingLeft: 2 }}>
            {[
              "Sample risks mapped to your selected framework(s)",
              "Pre-configured risk severity and likelihood levels",
              "Example mitigation controls and strategies",
              "Simulated compliance status and tracking",
            ].map((item, index) => (
              <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    backgroundColor: "#13715B",
                  }}
                />
                <Typography sx={{ fontSize: "12px", color: "#344054" }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Validation Message */}
        {!hasRequiredSelections && (
          <Box
            sx={{
              padding: 2,
              backgroundColor: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: "8px",
            }}
          >
            <Typography sx={{ fontSize: "12px", color: "#991B1B" }}>
              Please select both a use case and at least one framework to continue.
            </Typography>
          </Box>
        )}
      </Stack>
    </Stack>
  );
};

export default SampleProjectStep;
