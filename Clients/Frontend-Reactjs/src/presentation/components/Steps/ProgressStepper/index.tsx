/**
 * ProgressStepper component renders a stepper with customizable steps.
 * Each step displays a label and content, and the active step is highlighted.
 *
 * @component
 * @example
 * const steps = [
 *   { label: 'Step 1', content: 'Content for step 1' },
 *   { label: 'Step 2', content: 'Content for step 2' },
 *   { label: 'Step 3', content: 'Content for step 3' }
 * ];
 * return <ProgressStepper steps={steps} />;
 *
 * @param {ProgressStepperProps} props - The properties for the ProgressStepper component.
 * @param {StepProps[]} props.steps - An array of steps, each containing a label and content.
 *
 * @typedef {Object} StepProps
 * @property {string} label - The label for the step.
 * @property {string} content - The content for the step.
 *
 * @typedef {Object} ProgressStepperProps
 * @property {StepProps[]} steps - An array of steps to be displayed in the stepper.
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

interface ProgressStepperProps {
  steps: StepProps[];
}

const ProgressStepper: FC<ProgressStepperProps> = ({ steps }) => {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <Stepper activeStep={activeStep} alternativeLabel>
      {steps.map((step: StepProps, index: number) => {
        const color = activeStep === index ? "primary" : "inherit";
        return (
          <Step key={step.label} onClick={() => setActiveStep(index)}>
            <StepLabel StepIconComponent={CustomStepIcon}>
              <Typography
                variant="body1"
                color={color}
                sx={{ fontWeight: "bold" }}
              >
                {step.label}
              </Typography>
            </StepLabel>
            <Typography variant="body1" color={color}>
              {step.content}
            </Typography>
          </Step>
        );
      })}
    </Stepper>
  );
};

export default ProgressStepper;
