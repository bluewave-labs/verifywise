/**
 * A component that displays a check icon with a text label.
 *
 * @param {Object} props - The properties object.
 * @param {string} props.text - The text to display next to the check icon.
 * @param {"success" | "error" | "info" | "warning"} [props.variant="info"] - The variant of the check icon, which determines its color.
 * @param {boolean} [props.outlined=false] - If true, displays an outlined check icon; otherwise, displays a filled check icon.
 *
 * @returns {JSX.Element} The rendered Check component.
 */

import { Box, Stack, Typography, useTheme } from "@mui/material";
import "./index.css";

import { ReactComponent as CheckGrey } from "../../assets/icons/check.svg";
import { ReactComponent as CheckOutlined } from "../../assets/icons/checkbox-outline.svg";
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
    info: theme.palette.info.border,
    warning: theme.palette.warning.main,
  };

  return (
    <Stack
      direction={"row"}
      className="check"
      gap={outlined ? theme.spacing(6) : theme.spacing(4)}
      alignItems={"center"}
    >
      {outlined ? (
        <CheckOutlined />
      ) : (
        <Box
          lineHeight={0}
          sx={{
            "& svg > path": { fill: colors[variant] },
          }}
        >
          <CheckGrey />
        </Box>
      )}
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
