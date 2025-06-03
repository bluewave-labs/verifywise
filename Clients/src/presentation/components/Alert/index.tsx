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
import { AlertProps } from "../../../domain/interfaces/iAlert";
import { closeIconStyles, iconButtonStyles } from "./style";
import { CloseIconProps } from "../../../domain/interfaces/iWidget";
import AlertBody from "./AlertBody";

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
  sx,
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
        ...sx,
      }}
    >
      {hasIcon && (
        <Box sx={{ color: text, maxHeight: "22.28px" }}> {icon} </Box>
      )}
      <Stack direction={"column"} gap={"2px"} sx={{ flex: 1 }}>
        {title && (
          <Typography sx={{ fontWeight: 700, color: text }}>{title}</Typography>
        )}
        {body && <AlertBody body={body} textColor={text} />}
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
