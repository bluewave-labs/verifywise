/**
 * VWStepper component renders a customizable stepper.
 * It supports dynamic step configurations, theming, and clean architecture principles.
 *
 * @component
 * @example
 * const steps = [
 *   { label: "Step 1", content: "Content for step 1" },
 *   { label: "Step 2", content: "Content for step 2" },
 *   { label: "Step 3", content: "Content for step 3" }
 * ];
 * return <VWStepper steps={steps} />;
 *
 * @typedef {Object} StepProps
 * @property {string} label - The label for the step.
 * @property {string} content - The content for the step.
 *
 * @typedef {Object} VWStepperProps
 * @property {StepProps[]} steps - An array of steps to be displayed.
 * @property {number} [initialStep=0] - The initially active step.
 * @property {boolean} [alternativeLabel=true] - Whether to use alternative labeling.
 * @property {function} [onStepChange] - Callback function when a step is clicked.
 *
 * @returns {JSX.Element} The rendered stepper component.
 */

import { FC, useState } from "react";
import { Stepper, Step, StepLabel, Typography } from "@mui/material";
import CustomStepIcon from "../StepIcon";

interface StepProps {
  label: string;
  content: string;
}

interface VWStepperProps {
  steps: StepProps[];
  initialStep?: number;
  alternativeLabel?: boolean;
  onStepChange?: (stepIndex: number) => void;
}

const VWStepper: FC<VWStepperProps> = ({
  steps,
  initialStep = 0,
  alternativeLabel = true,
  onStepChange,
}) => {
  const [activeStep, setActiveStep] = useState<number>(initialStep);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    if (onStepChange) {
      onStepChange(index);
    }
  };

  return (
    <Stepper activeStep={activeStep} alternativeLabel={alternativeLabel} className="vw-stepper">
      {steps.map((step, index) => (
        <Step key={step.label} onClick={() => handleStepClick(index)} className="vw-step">
          <StepLabel StepIconComponent={CustomStepIcon}>
            <Typography
              variant="body1"
              color={activeStep === index ? "primary" : "inherit"}
              sx={{ fontWeight: "bold" }}
            >
              {step.label}
            </Typography>
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

export default VWStepper;
