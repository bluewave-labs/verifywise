/**
 * A component that displays a check/circle icon with a text label.
 *
 * @param {Object} props - The properties object.
 * @param {string} props.text - The text to display next to the icon.
 * @param {"success" | "error" | "info" | "warning"} [props.variant="info"] - The variant determines icon and color:
 *   - "success": Green checkmark (requirement met)
 *   - "info": Gray circle (requirement not yet met)
 *   - "error": Red X (requirement failed)
 *   - "warning": Orange warning
 * @param {boolean} [props.outlined=false] - If true, displays an outlined icon.
 *
 * @returns {JSX.Element} The rendered Check component.
 */

import { Box, Stack, Typography, useTheme } from "@mui/material";
import "./index.css";

import { Check as CheckIcon, Circle, X as XIcon } from "lucide-react";
import { Square as CheckOutlined } from "lucide-react";
import { CheckVariants } from "../../../domain/enums/checkVariants";

const Check = ({
  text,
  variant = "info",
  outlined = false,
}: {
  text: string;
  variant?: CheckVariants;
  outlined?: boolean;
}) => {
  const theme = useTheme();
  const colors = {
    success: theme.palette.success.main,
    error: theme.palette.error.text,
    info: theme.palette.text.accent,
    warning: theme.palette.warning.main,
  };

  // Render the appropriate icon based on variant
  const renderIcon = () => {
    if (outlined) {
      return <CheckOutlined size={16} />;
    }

    switch (variant) {
      case "success":
        return <CheckIcon size={16} color={colors.success} />;
      case "error":
        return <XIcon size={16} color={colors.error} />;
      case "info":
      default:
        return <Circle size={16} color={colors.info} />;
      case "warning":
        return <CheckIcon size={16} color={colors.warning} />;
    }
  };

  return (
    <Stack
      direction={"row"}
      className="check"
      gap={outlined ? theme.spacing(6) : theme.spacing(4)}
      alignItems={"center"}
    >
      <Box lineHeight={0}>
        {renderIcon()}
      </Box>
      <Typography
        component="span"
        sx={{
          color:
            variant === "info" ? theme.palette.text.tertiary : colors[variant],
          opacity: 0.8,
          fontSize: 11,
        }}
      >
        {text}
      </Typography>
    </Stack>
  );
};

export default Check;
