/**
 * @fileoverview Alert component for displaying various types of messages.
 *
 * This component renders an alert box with different styles based on the variant prop.
 * It supports displaying icons, titles, and body text, and can function as a toast notification.
 *
 * @package
 */

import "./index.css";
import React from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SuccessOutlinedIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutline";
import WarningOutlinedIcon from "@mui/icons-material/WarningOutlined";
import CloseIcon from "@mui/icons-material/Close";
import singleTheme from "../../themes/v1SingleTheme";

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
}

/**
 * Props for the CloseButton component.
 *
 * @interface CloseIconProps
 * @property {string} text - The color of the close icon.
 */
interface CloseIconProps {
  text: string;
}

/**
 * Styles for the IconButton component.
 *
 * @param {boolean} hasIcon - Whether the alert has an icon.
 * @returns {object} The styles for the IconButton component.
 */
const iconButtonStyles = (hasIcon: boolean): object => ({
  alignSelf: "flex-start",
  ml: "auto",
  mr: "-5px",
  mt: hasIcon ? "-5px" : 0,
  "&:focus": {
    outline: "none",
  },
  "&:hover": {
    backgroundColor: "transparent",
  },
});

/**
 * Styles for the CloseIcon component.
 *
 * @param {string} text - The color of the close icon.
 * @returns {object} The styles for the CloseIcon component.
 */
const closeIconStyles = (text: string): object => ({
  fontSize: 20,
  fill: text,
});

/**
 * Mapping of alert variants to their respective icons.
 *
 * @constant
 * @type {object}
 */
const icons: { [s: string]: JSX.Element } = {
  success: <SuccessOutlinedIcon />,
  info: <InfoOutlinedIcon style={{ fill: "#0288d1" }} />,
  error: <ErrorOutlinedIcon />,
  warning: <WarningOutlinedIcon />,
};

/**
 * CloseButton component for rendering the close icon.
 *
 * @param {CloseIconProps} props - The props for the CloseButton component.
 * @returns {JSX.Element} The rendered CloseButton component.
 */
const CloseButton: React.FC<CloseIconProps> = ({
  text,
}: CloseIconProps): JSX.Element => <CloseIcon sx={closeIconStyles(text)} />;

/**
 * Alert component for displaying various types of messages.
 *
 * @param {AlertProps} props - The props for the Alert component.
 * @returns {JSX.Element} The rendered Alert component.
 */
const Alert: React.FC<AlertProps> = ({
  variant,
  title,
  body,
  isToast,
  hasIcon = true,
  onClick,
}: AlertProps): JSX.Element => {
  const theme = useTheme();
  const { text, bg } = singleTheme.alertStyles[variant];
  const icon = icons[variant];

  return (
    <Stack
      className="alert row-stack"
      direction={"row"}
      justifyContent={"flex-start"}
      alignItems={"center"}
      gap={theme.spacing(8)}
      sx={{
        position: "fixed",
        top: theme.spacing(5),
        right: theme.spacing(5),
        zIndex: 9999,
        padding: hasIcon
          ? theme.spacing(8)
          : `${theme.spacing(4)} ${theme.spacing(8)}`,
        backgroundColor: bg,
        border: `1px solid ${text}`,
        borderRadius: theme.shape.borderRadius,
      }}
    >
      {hasIcon && (
        <Box sx={{ color: text, maxHeight: "22.28px" }}> {icon} </Box>
      )}
      <Stack direction={"column"} gap={"2px"} sx={{ flex: 1 }}>
        {title && (
          <Typography sx={{ fontWeight: 700, color: text }}>{title}</Typography>
        )}
        {body && (
          <Typography sx={{ fontWeight: 400, color: text }}>{body}</Typography>
        )}
      </Stack>
      {isToast && (
        <IconButton
          disableRipple
          onClick={onClick}
          sx={iconButtonStyles(hasIcon)}
        >
          <CloseButton text={text} />
        </IconButton>
      )}
    </Stack>
  );
};

export default Alert;
