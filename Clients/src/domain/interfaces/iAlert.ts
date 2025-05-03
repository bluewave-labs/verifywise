import { Theme } from "@mui/material";

import { SxProps } from "@mui/material";

export interface alertState {
  variant: "success" | "info" | "warning" | "error";
  title?: string;
  body: string;
}

/**
 * Props for the Alert component.
 *
 * @interface AlertProps
 * @property {"success" | "info" | "warning" | "error"} variant - The type of alert to display.
 * @property {string} title - The title text of the alert.
 * @property {string} body - The body text of the alert.
 * @property {boolean} isToast - Whether the alert is a toast notification.
 * @property {boolean} [hasIcon] - Whether to display an icon in the alert. Defaults to true.
 * @property {() => void} onClick - Callback function to handle click events.
 */
export interface AlertProps {
  variant: "success" | "info" | "warning" | "error";
  title?: string;
  body: string;
  isToast?: boolean;
  hasIcon?: boolean;
  onClick?: () => void;
  sx?: SxProps<Theme> | undefined;
}
