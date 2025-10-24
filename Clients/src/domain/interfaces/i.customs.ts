import { TooltipRenderProps } from "react-joyride";

export interface ICustomStepProps {
  header?: string;
  body: string;
  icon?: React.ReactNode;
}

export interface ICustomStepWrapperProps extends TooltipRenderProps {
  content: ICustomStepProps;
}

export interface IConfirmableDeleteIconButtonProps {
  id: number | string;
  onConfirm: (id: number | string) => void;
  title?: string;
  message?: string;
  customIcon?: React.ReactNode; // e.g., your <img src={trash} ... />
  disabled?: boolean;
}
