import React from "react";
import { Box, Typography, Stack, FormControl, RadioGroup, FormControlLabel, Radio, SelectChangeEvent } from "@mui/material";
import { OnboardingStepProps } from "../../../../domain/interfaces/i.onboarding";
import { OnboardingRole, OnboardingIndustry, OnboardingUseCase } from "../../../../domain/enums/onboarding.enum";
import Select from "../../../components/Inputs/Select";
import onboardingBanner from "../../../assets/onboarding-banner.svg";

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

  const handleRoleChange = (event: SelectChangeEvent<string | number>) => {
    const selectedItem = roleItems.find(item => item._id === Number(event.target.value));
    if (selectedItem) {
      updatePreferences?.({ role: selectedItem.name });
    }
  };

  const handleIndustryChange = (event: SelectChangeEvent<string | number>) => {
    const selectedItem = industryItems.find(item => item._id === Number(event.target.value));
    if (selectedItem) {
      updatePreferences?.({ industry: selectedItem.name });
    }
  };

  const handleUseCaseChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updatePreferences?.({ primaryUseCase: event.target.value as OnboardingUseCase });
  };

  const selectedRoleId = roleItems.find((item) => item.name === preferences?.role)?._id || "";
  const selectedIndustryId = industryItems.find((item) => item.name === preferences?.industry)?._id || "";

  return (
    <Stack spacing={4}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
        }}
      >
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
            display: "block",
          }}
        />
        <Typography
          variant="h5"
          sx={{
            position: "absolute",
            top: "40px",
            left: "50px",
            fontWeight: 600,
            fontSize: "24px",
            color: "#FFFFFF",
          }}
        >
          Tell us about yourself
        </Typography>
      </Box>

      <Box>
        <Typography
          sx={{
            fontSize: "14px",
            color: "#667085",
            marginBottom: 3,
          }}
        >
          Help us personalize your experience by sharing a bit about your role and focus. This information helps us customize your dashboard. You can skip this step or update these preferences later in settings.
        </Typography>
      </Box>

      <Stack spacing={4}>
        {/* Role Selection */}
        <FormControl fullWidth required>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#344054",
              marginBottom: 1,
            }}
          >
            What is your role? <span style={{ color: "#DC2626" }}>*</span>
          </Typography>
          <Select
            id="role-select"
            label=""
            placeholder="Select your role"
            value={selectedRoleId}
            onChange={handleRoleChange}
            items={roleItems}
            sx={{ width: "100%" }}
            isRequired
          />
        </FormControl>

        {/* Industry Selection */}
        <FormControl fullWidth required>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#344054",
              marginBottom: 1,
            }}
          >
            Which industry do you work in? <span style={{ color: "#DC2626" }}>*</span>
          </Typography>
          <Select
            id="industry-select"
            label=""
            placeholder="Select your industry"
            value={selectedIndustryId}
            onChange={handleIndustryChange}
            items={industryItems}
            sx={{ width: "100%" }}
            isRequired
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
    </Stack>
  );
};

export default PreferencesStep;
