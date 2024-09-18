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
