/**
 * StatusLabel component displays a label with a status indicator.
 *
 * @component
 * @param {Object} props - The properties object.
 * @param {"up" | "down" | "pending" | "cannot resolve"} props.status - The status of the label which determines the color scheme.
 * @param {string} props.text - The text to display inside the label.
 * @param {React.CSSProperties} [props.customStyles] - Optional custom styles to apply to the label.
 *
 * @returns {JSX.Element} The rendered StatusLabel component.
 *
 * @example
 * <StatusLabel status="up" text="Operational" />
 */

import { Box, useTheme } from "@mui/material";
import "../index.css";
import BaseLabel from "../BaseLabel";

interface StatusLabelProps {
  status: "up" | "down" | "pending" | "cannot resolve";
  text: string;
  customStyles?: React.CSSProperties;
}

const StatusLabel: React.FC<StatusLabelProps> = ({
  status,
  text,
  customStyles,
}) => {
  const theme = useTheme();
  const colors = {
    up: {
      dotColor: theme.palette.success.main,
      bgColor: theme.palette.success.bg,
      borderColor: theme.palette.success.light,
    },
    down: {
      dotColor: theme.palette.error.text,
      bgColor: theme.palette.error.bg,
      borderColor: theme.palette.error.light,
    },
    pending: {
      dotColor: theme.palette.warning.main,
      bgColor: theme.palette.warning.bg,
      borderColor: theme.palette.warning.light,
    },
    "cannot resolve": {
      dotColor: theme.palette.unresolved.main,
      bgColor: theme.palette.unresolved.bg,
      borderColor: theme.palette.unresolved.light,
    },
  };

  // Look up the color for the status
  const { borderColor, bgColor, dotColor } = colors[status];

  return (
    <BaseLabel
      label={text}
      styles={{
        color: dotColor,
        backgroundColor: bgColor,
        borderColor: borderColor,
        ...customStyles,
      }}
    >
      <Box
        width={7}
        height={7}
        bgcolor={dotColor}
        borderRadius="50%"
        marginRight="5px"
      />
    </BaseLabel>
  );
};

export default StatusLabel;
