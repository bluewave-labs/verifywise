/**
 * StepperModal - A modal with built-in stepper for multi-step forms
 * 
 * Combines StandardModal's styling with Material-UI Stepper functionality.
 * Maintains the clean footer with division line and proper button positioning.
 * 
 * @component
 * @example
 * ```tsx
 * const steps = ["Step 1", "Step 2", "Step 3"];
 * 
 * <StepperModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Create Configuration"
 *   steps={steps}
 *   activeStep={activeStep}
 *   onNext={handleNext}
 *   onBack={handleBack}
 *   onSubmit={handleSubmit}
 *   isSubmitting={loading}
 *   canProceed={isStepValid}
 * >
 *   {renderStepContent()}
 * </StepperModal>
 * ```
 */

import React from "react";
import { Modal, Stack, Box, Typography, Step, Stepper, StepLabel } from "@mui/material";
import { X as CloseIcon } from "lucide-react";
import CustomizableButton from "../../Button/CustomizableButton";

interface StepperModalProps {
  /** Controls whether the modal is visible */
  isOpen: boolean;

  /** Callback function called when modal should close */
  onClose: () => void;

  /** Main title displayed in the header */
  title: string;

  /** Array of step labels */
  steps: string[];

  /** Current active step (0-indexed) */
  activeStep: number;

  /** Callback for moving to next step */
  onNext?: () => void;

  /** Callback for moving to previous step */
  onBack?: () => void;

  /** Callback for final submission (on last step) */
  onSubmit?: () => void;

  /** Current step content */
  children: React.ReactNode;

  /** When true, disables the action button */
  isSubmitting?: boolean;

  /** When true, enables the Next/Submit button (for validation) */
  canProceed?: boolean;

  /** Text for the final submit button (default: "Submit") */
  submitButtonText?: string;

  /** Maximum width of the modal (default: "900px") */
  maxWidth?: string;
}

const StepperModal: React.FC<StepperModalProps> = ({
  isOpen,
  onClose,
  title,
  steps,
  activeStep,
  onNext,
  onBack,
  onSubmit,
  children,
  isSubmitting = false,
  canProceed = true,
  submitButtonText = "Submit",
  maxWidth = "1000px",
}) => {
  const isLastStep = activeStep === steps.length - 1;
  const isFirstStep = activeStep === 0;

  const handleActionClick = () => {
    if (isLastStep && onSubmit) {
      onSubmit();
    } else if (onNext) {
      onNext();
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={(_event, reason) => {
        if (reason !== "backdropClick") {
          onClose();
        }
      }}
      sx={{ overflowY: "scroll" }}
    >
      <Stack
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "fit-content",
          minWidth: "600px",
          maxWidth: maxWidth,
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          overflow: "hidden",
          "&:focus": {
            outline: "none",
          },
        }}
      >
        {/* Header Section */}
        <Stack
          sx={{
            background: "linear-gradient(180deg, #F8FAFB 0%, #F3F5F8 100%)",
            borderBottom: "1px solid #E0E4E9",
            padding: "16px 24px",
            paddingBottom: "24px",
            zIndex: 0,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#101828",
                  lineHeight: 1.5,
                }}
              >
                {title}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
                  fontSize: "12px",
                  color: "#475467",
                  marginTop: "4px",
                  lineHeight: 1.5,
                }}
              >
                Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
              </Typography>
            </Box>

            <Box
              component="button"
              onClick={onClose}
              sx={{
                background: "none",
                border: "none",
                padding: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#667085",
                transition: "color 0.2s",
                "&:hover": {
                  color: "#101828",
                },
              }}
            >
              <CloseIcon size={20} />
            </Box>
          </Stack>
        </Stack>

        {/* Stepper */}
        <Box sx={{ px: 3, pt: 3, pb: 2, backgroundColor: "#FAFBFC" }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      fontSize: "13px",
                      fontWeight: activeStep === index ? 600 : 400,
                    },
                    "& .MuiStepIcon-root": {
                      color: activeStep >= index ? "#13715B" : "#E0E4E9",
                    },
                    "& .MuiStepIcon-text": {
                      fill: "#FFFFFF",
                      fontSize: "12px",
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Content Section */}
        <Box
          sx={{
            padding: "24px",
            flex: 1,
            overflow: "auto",
            maxHeight: "calc(90vh - 240px)",
            border: "1px solid #E0E4E9",
            borderRadius: "16px",
            backgroundColor: "#FFFFFF",
            zIndex: 1,
            position: "relative",
          }}
        >
          {children}
        </Box>

        {/* Footer Section with Division Line - Compact */}
        <Stack
          direction="row"
          justifyContent="space-between"
          spacing={6}
          sx={{
            background: "linear-gradient(180deg, #F3F5F8 0%, #F8FAFB 100%)",
            borderTop: "1px solid #E0E4E9",
            padding: "10px 24px",
            paddingTop: "16px",
            zIndex: 0,
          }}
        >
          <CustomizableButton
            variant="outlined"
            text="Cancel"
            onClick={onClose}
            sx={{
              minWidth: "70px",
              height: "32px",
              fontSize: "13px",
              border: "1px solid #D0D5DD",
              color: "#344054",
              "&:hover": {
                backgroundColor: "#F9FAFB",
                border: "1px solid #D0D5DD",
              },
            }}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            {!isFirstStep && onBack && (
              <CustomizableButton
                variant="outlined"
                text="Back"
                onClick={onBack}
                sx={{
                  minWidth: "70px",
                  height: "32px",
                  border: "1px solid #D0D5DD",
                  color: "#344054",
                  fontSize: "13px",
                  "&:hover": {
                    backgroundColor: "#F9FAFB",
                    border: "1px solid #D0D5DD",
                  },
                }}
              />
            )}

            <CustomizableButton
              variant="contained"
              text={isLastStep ? submitButtonText : "Next"}
              onClick={handleActionClick}
              isDisabled={!canProceed || isSubmitting}
              loading={isSubmitting}
              sx={{
                minWidth: "70px",
                height: "32px",
                fontSize: "13px",
                backgroundColor: "#13715B",
                "&:hover:not(.Mui-disabled)": {
                  backgroundColor: "#0F5A47",
                },
                "&.Mui-disabled": {
                  backgroundColor: "#E5E7EB",
                  color: "#9CA3AF",
                  cursor: "not-allowed",
                },
              }}
            />
          </Box>
        </Stack>
      </Stack>
    </Modal>
  );
};

export default StepperModal;

