import "./index.css";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SuccessOutlinedIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutline";
import WarningOutlinedIcon from "@mui/icons-material/WarningOutlined";
import CloseIcon from "@mui/icons-material/Close";

/**
 * Icons mapping for different alert variants.
 * @type {Object<string, JSX.Element>}
 */

const icons: { [s: string]: JSX.Element } = {
  success: <SuccessOutlinedIcon />,
  info: <InfoOutlinedIcon style={{ fill: "#0288d1" }} />,
  error: <ErrorOutlinedIcon />,
  warning: <WarningOutlinedIcon />,
};

/**
 * Represents an Alert component.
 *
 * @component
 * @param {Object} props
 * @param {'success' | 'info' | 'warning' | 'error'} props.variant - The variant of the alert.
 * @param {string} [props.title] - The title of the alert.
 * @param {string} [props.body] - The body of the alert.
 * @param {boolean} [props.isToast] - Indicates if the alert is a toast.
 * @param {boolean} [props.hasIcon] - Indicates if the alert has an icon. Default is true.
 * @param {Function} props.onClick - The function to be called when the alert is clicked.
 * @returns {JSX.Element} The rendered Alert component.
 */

type AlertProps = {
  variant: "success" | "info" | "warning" | "error";
  title: string;
  body: string;
  isToast: boolean;
  hasIcon?: boolean;
  onClick: Function;
};

const Alert = ({
  variant,
  title,
  body,
  isToast,
  hasIcon = true,
  onClick,
}: AlertProps) => {
  const theme = useTheme();
  const { text, bg } = theme.palette.status[variant];
  const icon = icons[variant];

  return (
    <Stack
      className="alert row-stack"
      direction={"row"}
      justifyContent={"flex-start"}
      alignItems={hasIcon ? "" : "center"}
      gap={theme.spacing(8)}
      sx={{
        padding: hasIcon
          ? theme.spacing(8)
          : `${theme.spacing(4)} ${theme.spacing(8)}`,
        backgroundColor: bg,
        border: `1px solid ${text}`,
        borderRadius: theme.shape.borderRadius,
      }}
    >
      {hasIcon && <Box sx={{ color: text }}> {icon} </Box>}
      <Stack direction={"column"} gap={"2px"} sx={{ flex: 1 }}>
        {title && (
          <Typography sx={{ fontWeight: 700, color: text }}>{title}</Typography>
        )}
        {body && (
          <Typography sx={{ fontWeight: 400, color: text }}>{body}</Typography>
        )}
        {hasIcon && isToast && (
          <Button
            disableRipple
            variant="text"
            color={variant}
            onClick={() => onClick()}
            sx={{
              fontWeight: "600",
              width: "fit-content",
              mt: theme.spacing(4),
              padding: 0,
              minWidth: 0,
              "&:hover": {
                backgroundColor: "transparent",
              },
            }}
          >
            Dismiss
          </Button>
        )}
      </Stack>
      {isToast && (
        <IconButton
          disableRipple
          onClick={() => onClick()}
          sx={{
            alignSelf: "flex-start",
            ml: "auto",
            mr: "-5px",
            mt: hasIcon ? "-5px" : 0,
            padding: "5px",
            "&:focus": {
              outline: "none",
            },
            "&:hover": {
              backgroundColor: "transparent",
            },
          }}
        >
          <CloseIcon
            sx={{
              fontSize: 20,
              fill: text,
            }}
          />
        </IconButton>
      )}
    </Stack>
  );
};

export default Alert;
