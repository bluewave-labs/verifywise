import React from "react";
import { Box } from "@mui/material";
import { IButtonToggleProps } from "../../../domain/interfaces/i.button";

const frameworkTabsContainerStyle = (height: number) => ({
  position: "relative",
  display: "flex",
  border: (theme: any) => `1px solid ${theme.palette.divider}`,
  borderRadius: "4px",
  overflow: "hidden",
  height,
  bgcolor: "action.hover",
  width: "fit-content",
  padding: "2px",
  gap: "2px",
});

const getFrameworkTabStyle = () => ({
  cursor: "pointer",
  px: 5,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: "text.primary",
  fontFamily: (theme: any) => theme.typography.fontFamily,
  fontSize: "13px",
  fontWeight: (theme: any) => theme.typography.body2.fontWeight,
  userSelect: "none",
  width: "fit-content",
  minWidth: "120px",
  position: "relative",
  zIndex: 1,
  transition: "color 0.3s ease",
});

const getSliderStyle = (activeIndex: number, optionsCount: number) => ({
  position: "absolute",
  top: "2px",
  left: "2px",
  height: "calc(100% - 4px)",
  width: `calc((100% - ${(optionsCount + 1) * 2}px) / ${optionsCount})`,
  bgcolor: "background.paper",
  border: "1px solid rgba(0, 0, 0, 0.08)",
  borderRadius: "4px",
  transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  transform: `translateX(calc(${activeIndex} * (100% + 2px)))`,
  zIndex: 0,
});

const ButtonToggle: React.FC<IButtonToggleProps> = ({
  options,
  value,
  onChange,
  height = 34,
}) => {
  const activeIndex = options.findIndex((option) => option.value === value);

  return (
    <Box sx={frameworkTabsContainerStyle(height)}>
      {/* Sliding background */}
      <Box sx={getSliderStyle(activeIndex, options.length)} />

      {/* Button options */}
      {options.map((option) => (
        <Box
          key={option.value}
          onClick={() => onChange(option.value)}
          sx={getFrameworkTabStyle()}
        >
          {option.label}
          {option.count !== undefined && (
            <Box
              component="span"
              sx={{
                ml: 2,
                px: 1.5,
                py: 0.25,
                borderRadius: "10px",
                bgcolor: option.value === value ? "#F2F4F7" : "#E4E7EC",
                color: "#344054",
                fontSize: "11px",
                fontWeight: 500,
                minWidth: "20px",
                textAlign: "center",
              }}
            >
              {option.count}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default ButtonToggle;
