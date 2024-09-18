/**
 * CustomStepIcon component renders a step icon based on the completion and active status.
 *
 * @param props - The properties for the CustomStepIcon component.
 * @param props.completed - Indicates if the step is completed.
 * @param props.active - Indicates if the step is currently active.
 *
 * @returns A CheckCircle icon if the step is completed, otherwise a RadioButtonCheckedIcon.
 */

import "./index.css";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import CheckCircle from "@mui/icons-material/CheckCircle";
import { FC } from "react";

interface CustomStepIconProps {
  active?: boolean; // Allow undefined
  completed?: boolean; // Allow undefined
  error?: boolean;
}

const CustomStepIcon: FC<CustomStepIconProps> = ({
  active = false, // Default to false if undefined
  completed = false,
}) => {
  return completed ? (
    <CheckCircle color="primary" />
  ) : (
    <RadioButtonCheckedIcon color={active ? "primary" : "disabled"} />
  );
};

export default CustomStepIcon;
