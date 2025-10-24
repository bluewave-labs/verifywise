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

export interface ICustomModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: any;
  content: any;
  subControlTlts: string[];
  onConfirm: () => void;
}

export interface IDeleteAccountConfirmationProps {
  open: boolean;
  onClose: () => void;
}
