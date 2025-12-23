/**
 * Alert component types
 * Pure domain types with no framework dependencies
 */

export interface alertState {
  variant: "success" | "info" | "warning" | "error";
  title?: string;
  body: string;
}

export interface AlertCorProps {
  variant: "success" | "info" | "warning" | "error";
  title?: string;
  body: string;
  isToast?: boolean;
  hasIcon?: boolean;
  onClick?: () => void;
  alertTimeout?: number;
}
