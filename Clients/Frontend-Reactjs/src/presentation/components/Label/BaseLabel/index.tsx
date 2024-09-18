/**
 * BaseLabel component renders a label with optional custom styles and children.
 * It utilizes Material-UI's Box component and theme for styling.
 *
 * @param {BaseLabelProps} props - The properties for the BaseLabel component.
 * @param {string} props.label - The text to be displayed as the label.
 * @param {CSSProperties} [props.styles] - Optional custom styles to be applied to the label.
 * @param {ReactNode} [props.children] - Optional children elements to be rendered inside the label.
 *
 * @returns {JSX.Element} The rendered BaseLabel component.
 */

import { Box, useTheme } from "@mui/material";
import "../index.css";

import { ReactNode, CSSProperties } from "react";

interface BaseLabelProps {
  label: string;
  styles?: CSSProperties;
  children?: ReactNode;
}

const BaseLabel = ({ label, styles, children }: BaseLabelProps) => {
  const theme = useTheme();
  const { borderRadius } = theme.shape;
  const padding = theme.spacing(1 * 0.75, 2);

  return (
    <Box
      className="label"
      sx={{
        borderRadius: borderRadius,
        borderColor: theme.palette.text.tertiary,
        color: theme.palette.text.tertiary,
        padding: padding,
        ...styles,
      }}
    >
      {children}
      {label}
    </Box>
  );
};

export default BaseLabel;
