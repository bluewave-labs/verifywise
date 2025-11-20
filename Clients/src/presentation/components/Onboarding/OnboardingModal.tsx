import React, { useState, useMemo, useCallback } from "react";
import { Box, Stack } from "@mui/material";
import { useOnboarding } from "../../../application/hooks/useOnboarding";
import { ONBOARDING_STEPS } from "./onboardingConstants";
import ProgressDots from "./ProgressDots";
import SkipConfirmation from "./SkipConfirmation";
import CustomizableButton from "../Button/CustomizableButton";
import { OnboardingModalProps } from "../../../domain/interfaces/i.onboarding";
import WelcomeStep from "./steps/WelcomeStep";
import PreferencesStep from "./steps/PreferencesStep";
import UseCasesStep from "./steps/UseCasesStep";
import FrameworksStep from "./steps/FrameworksStep";
import RiskManagementStep from "./steps/RiskManagementStep";
import AdminSetupStep from "./steps/AdminSetupStep";
import TaskWorkflowStep from "./steps/TaskWorkflowStep";
import SampleProjectStep from "./steps/SampleProjectStep";

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onComplete,
  onSkip,
  isRevisit = false,
}) => {
  const {
    state,
    isAdmin,
    isInvitedUser,
    setCurrentStep,
    completeStep,
    skipStep,
    updatePreferences,
    updateSampleProject,
    completeOnboarding,
  } = useOnboarding();

  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");

  // Filter steps based on user role and invited status
  const availableSteps = useMemo(() => {
    return ONBOARDING_STEPS.filter((step) => {
      // Skip sample project creation on revisit or for invited users
      if (isRevisit && step.id === 8) return false;
      if (isInvitedUser && step.id === 8) return false;

      // Filter based on admin/user role
      if (isAdmin) {
        return step.showForAdmin;
      } else {
        return step.showForUser;
      }
    });
  }, [isAdmin, isInvitedUser, isRevisit]);

  const currentStepIndex = state.currentStep;
  const currentStepConfig = availableSteps[currentStepIndex];
  const totalSteps = availableSteps.length;

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      completeStep(currentStepConfig.id);
      setSlideDirection("left");
      setCurrentStep(currentStepIndex + 1);
    } else {
      // Last step - complete onboarding
      completeStep(currentStepConfig.id);
      completeOnboarding();
      onComplete?.();
    }
  }, [currentStepIndex, totalSteps, currentStepConfig, completeStep, setCurrentStep, completeOnboarding, onComplete]);

  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setSlideDirection("right");
      setCurrentStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, setCurrentStep]);

  const handleSkipStep = useCallback(() => {
    setShowSkipConfirmation(true);
  }, []);

  const confirmSkip = useCallback(() => {
    skipStep(currentStepConfig.id);
    setShowSkipConfirmation(false);

    if (currentStepIndex < totalSteps - 1) {
      setSlideDirection("left");
      setCurrentStep(currentStepIndex + 1);
    } else {
      completeOnboarding();
      onSkip?.();
    }
  }, [currentStepConfig, currentStepIndex, totalSteps, skipStep, setCurrentStep, completeOnboarding, onSkip]);

  const cancelSkip = useCallback(() => {
    setShowSkipConfirmation(false);
  }, []);

  // Get the appropriate step component
  const StepComponent = useMemo(() => {
    switch (currentStepConfig.componentName) {
      case "WelcomeStep":
        return WelcomeStep;
      case "PreferencesStep":
        return PreferencesStep;
      case "UseCasesStep":
        return UseCasesStep;
      case "FrameworksStep":
        return FrameworksStep;
      case "RiskManagementStep":
        return RiskManagementStep;
      case "AdminSetupStep":
        return AdminSetupStep;
      case "TaskWorkflowStep":
        return TaskWorkflowStep;
      case "SampleProjectStep":
        return SampleProjectStep;
      default:
        return WelcomeStep;
    }
  }, [currentStepConfig]);

  const stepProps = {
    onNext: handleNext,
    onBack: handleBack,
    onSkip: handleSkipStep,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === totalSteps - 1,
    currentStep: currentStepIndex,
    totalSteps,
    preferences: state.preferences,
    sampleProject: state.sampleProject,
    updatePreferences,
    updateSampleProject,
  };

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(2px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 2,
        }}
      >
        <Box
          sx={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            width: "60%",
            maxWidth: "900px",
            maxHeight: "80vh",
            overflow: "auto",
            position: "relative",
          }}
        >
          {/* Step content with slide animation */}
          <Box
            sx={{
              padding: "32px",
              minHeight: "400px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              key={currentStepIndex}
              sx={{
                animation: `slide-${slideDirection} 0.4s cubic-bezier(0.4, 0, 0.2, 1)`,
                "@keyframes slide-left": {
                  from: {
                    transform: "translateX(100%)",
                    opacity: 0,
                  },
                  to: {
                    transform: "translateX(0)",
                    opacity: 1,
                  },
                },
                "@keyframes slide-right": {
                  from: {
                    transform: "translateX(-100%)",
                    opacity: 0,
                  },
                  to: {
                    transform: "translateX(0)",
                    opacity: 1,
                  },
                },
              }}
            >
              <StepComponent {...stepProps} />
            </Box>
          </Box>

          {/* Footer with progress and navigation */}
          <Box
            sx={{
              padding: "32px",
              paddingTop: 0,
            }}
          >
            <Stack spacing={3}>
              <ProgressDots totalSteps={totalSteps} currentStep={currentStepIndex} />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <CustomizableButton
                  variant="text"
                  text="Skip Onboarding"
                  onClick={handleSkipStep}
                  sx={{
                    color: "#6B7280",
                    "&:hover": {
                      backgroundColor: "transparent",
                      color: "#374151",
                    },
                  }}
                />

                <Stack direction="row" gap={2}>
                  {!stepProps.isFirstStep && (
                    <CustomizableButton
                      variant="outlined"
                      text="Back"
                      onClick={handleBack}
                      sx={{
                        borderColor: "#D0D5DD",
                        color: "#344054",
                        "&:hover": {
                          borderColor: "#98A2B3",
                        },
                      }}
                    />
                  )}
                  <CustomizableButton
                    variant="contained"
                    text={stepProps.isLastStep ? "Finish" : "Next"}
                    onClick={handleNext}
                    sx={{
                      backgroundColor: "#13715B",
                      "&:hover": {
                        backgroundColor: "#0F5A47",
                      },
                    }}
                  />
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Box>

      <SkipConfirmation
        open={showSkipConfirmation}
        onConfirm={confirmSkip}
        onCancel={cancelSkip}
      />
    </>
  );
};

export default OnboardingModal;
