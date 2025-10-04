import React from "react";
import { Box } from "@mui/material";

interface ButtonToggleOption {
  value: string;
  label: string;
}

interface ButtonToggleProps {
  options: ButtonToggleOption[];
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

const frameworkTabsContainerStyle = (height: number) => ({
  display: "flex",
  border: (theme: any) => `1px solid ${theme.palette.divider}`,
  borderRadius: "4px",
  overflow: "hidden",
  height,
  bgcolor: "background.paper",
  width: "fit-content",
});

const getFrameworkTabStyle = (isActive: boolean, isLast: boolean) => ({
  cursor: "pointer",
  px: 5,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  bgcolor: isActive ? "background.paper" : "action.hover",
  color: "text.primary",
  fontFamily: (theme: any) => theme.typography.fontFamily,
  fontSize: "13px",
  borderRight: (theme: any) =>
    isLast ? "none" : `1px solid ${theme.palette.divider}`,
  fontWeight: (theme: any) => theme.typography.body2.fontWeight,
  transition: "background 0.2s",
  userSelect: "none",
  width: "fit-content",
  minWidth: "120px",
});

const ButtonToggle: React.FC<ButtonToggleProps> = ({
  options,
  value,
  onChange,
  height = 34,
}) => {
  return (
    <Box sx={frameworkTabsContainerStyle(height)}>
      {options.map((option, index) => (
        <Box
          key={option.value}
          onClick={() => onChange(option.value)}
          sx={getFrameworkTabStyle(value === option.value, index === options.length - 1)}
        >
          {option.label}
        </Box>
      ))}
    </Box>
  );
};

export default ButtonToggle;