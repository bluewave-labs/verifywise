import React from "react";
import { Box, Typography, Stack, FormControl, RadioGroup, FormControlLabel, Radio, SelectChangeEvent, Select, MenuItem } from "@mui/material";
import { OnboardingStepProps } from "../../../../domain/interfaces/i.onboarding";
import { OnboardingRole, OnboardingIndustry, OnboardingUseCase } from "../../../../domain/enums/onboarding.enum";
import onboardingBanner from "../../../assets/onboarding-banner.svg";

const PreferencesStep: React.FC<OnboardingStepProps> = ({
  preferences,
  updatePreferences,
}) => {
  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    updatePreferences?.({ role: event.target.value as OnboardingRole });
  };

  const handleIndustryChange = (event: SelectChangeEvent<string>) => {
    updatePreferences?.({ industry: event.target.value as OnboardingIndustry });
  };

  const handleUseCaseChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updatePreferences?.({ primaryUseCase: event.target.value as OnboardingUseCase });
  };

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
            borderRadius: "4px",
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
            value={preferences?.role || ""}
            onChange={handleRoleChange}
            displayEmpty
            sx={{
              width: "100%",
              fontSize: "13px",
              backgroundColor: "#FFFFFF",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#D0D5DD",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#13715B",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#13715B",
              },
            }}
          >
            <MenuItem value="" disabled sx={{ fontSize: "13px", color: "#9CA3AF" }}>
              Select your role
            </MenuItem>
            {Object.values(OnboardingRole).map((role) => (
              <MenuItem key={role} value={role} sx={{ fontSize: "13px" }}>
                {role}
              </MenuItem>
            ))}
          </Select>
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
            value={preferences?.industry || ""}
            onChange={handleIndustryChange}
            displayEmpty
            sx={{
              width: "100%",
              fontSize: "13px",
              backgroundColor: "#FFFFFF",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#D0D5DD",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#13715B",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#13715B",
              },
            }}
          >
            <MenuItem value="" disabled sx={{ fontSize: "13px", color: "#9CA3AF" }}>
              Select your industry
            </MenuItem>
            {Object.values(OnboardingIndustry).map((industry) => (
              <MenuItem key={industry} value={industry} sx={{ fontSize: "13px" }}>
                {industry}
              </MenuItem>
            ))}
          </Select>
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
