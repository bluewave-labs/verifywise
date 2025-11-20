import React from "react";
import { Box, Typography, Stack, FormControl, RadioGroup, FormControlLabel, Radio } from "@mui/material";
import { OnboardingStepProps } from "../../../../domain/interfaces/i.onboarding";
import { OnboardingRole, OnboardingIndustry, OnboardingUseCase } from "../../../../domain/enums/onboarding.enum";
import Illustration from "../Illustrations";
import { IllustrationType } from "../../../../domain/enums/onboarding.enum";
import Select from "../../../components/Inputs/Select";

const PreferencesStep: React.FC<OnboardingStepProps> = ({
  preferences,
  updatePreferences,
}) => {
  const roleItems = Object.values(OnboardingRole).map((role, index) => ({
    _id: index + 1,
    name: role,
  }));

  const industryItems = Object.values(OnboardingIndustry).map((industry, index) => ({
    _id: index + 1,
    name: industry,
  }));

  const handleRoleChange = (event: any) => {
    const selectedRole = Object.values(OnboardingRole).find(
      (role) => roleItems.find(item => item._id === Number(event.target.value))?.name === role
    );
    updatePreferences?.({ role: selectedRole });
  };

  const handleIndustryChange = (event: any) => {
    const selectedIndustry = Object.values(OnboardingIndustry).find(
      (industry) => industryItems.find(item => item._id === Number(event.target.value))?.name === industry
    );
    updatePreferences?.({ industry: selectedIndustry });
  };

  const handleUseCaseChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updatePreferences?.({ primaryUseCase: event.target.value as OnboardingUseCase });
  };

  const selectedRoleId = roleItems.find((item) => item.name === preferences?.role)?._id || "";
  const selectedIndustryId = industryItems.find((item) => item.name === preferences?.industry)?._id || "";

  return (
    <Stack spacing={4}>
      <Illustration type={IllustrationType.ICON_GRID} />

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
          Tell us about yourself
        </Typography>
        <Typography
          sx={{
            fontSize: "14px",
            color: "#667085",
            marginBottom: 3,
          }}
        >
          Help us personalize your experience by sharing a bit about your role and focus.
        </Typography>
      </Box>

      <Stack spacing={4}>
        {/* Role Selection */}
        <FormControl fullWidth>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#344054",
              marginBottom: 1,
            }}
          >
            What is your role?
          </Typography>
          <Select
            id="role-select"
            label=""
            value={selectedRoleId}
            onChange={handleRoleChange}
            items={roleItems}
            sx={{ width: "100%" }}
          />
        </FormControl>

        {/* Industry Selection */}
        <FormControl fullWidth>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#344054",
              marginBottom: 1,
            }}
          >
            Which industry do you work in?
          </Typography>
          <Select
            id="industry-select"
            label=""
            value={selectedIndustryId}
            onChange={handleIndustryChange}
            items={industryItems}
            sx={{ width: "100%" }}
          />
        </FormControl>

        {/* Primary Use Case */}
        <FormControl>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#344054",
              marginBottom: 2,
            }}
          >
            What's your primary focus?
          </Typography>
          <RadioGroup
            value={preferences?.primaryUseCase || ""}
            onChange={handleUseCaseChange}
          >
            {Object.values(OnboardingUseCase).map((useCase) => (
              <FormControlLabel
                key={useCase}
                value={useCase}
                control={
                  <Radio
                    sx={{
                      color: "#D0D5DD",
                      "&.Mui-checked": {
                        color: "#13715B",
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: "13px", color: "#344054" }}>
                    {useCase}
                  </Typography>
                }
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Stack>

      <Box
        sx={{
          backgroundColor: "#F9FAFB",
          borderRadius: "8px",
          padding: 2,
        }}
      >
        <Typography sx={{ fontSize: "12px", color: "#6B7280", fontStyle: "italic" }}>
          This information helps us customize your dashboard. You can skip this step or update these preferences later in settings.
        </Typography>
      </Box>
    </Stack>
  );
};

export default PreferencesStep;
