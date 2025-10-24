import { TooltipRenderProps } from "react-joyride";

export interface ICustomStepProps {
  header?: string;
  body: string;
  icon?: React.ReactNode;
}

export interface ICustomStepWrapperProps extends TooltipRenderProps {
  content: ICustomStepProps;
}
