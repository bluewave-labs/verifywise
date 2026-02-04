import React, { useRef, useEffect, useState } from "react";
import { Box } from "@mui/material";
import { IButtonToggleProps } from "../../types/interfaces/i.button";

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

interface SliderPosition {
  left: number;
  width: number;
}

const getSliderStyle = (position: SliderPosition) => ({
  position: "absolute",
  top: "2px",
  height: "calc(100% - 4px)",
  bgcolor: "background.paper",
  border: "1px solid rgba(0, 0, 0, 0.08)",
  borderRadius: "4px",
  transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  left: `${position.left}px`,
  width: `${position.width}px`,
  zIndex: 0,
});

const ButtonToggle: React.FC<IButtonToggleProps> = ({
  options,
  value,
  onChange,
  height = 34,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [sliderPosition, setSliderPosition] = useState<SliderPosition>({ left: 2, width: 120 });

  const activeIndex = options.findIndex((option) => option.value === value);

  // Update slider position when active tab changes
  useEffect(() => {
    const updateSliderPosition = () => {
      const activeTab = tabRefs.current[activeIndex];
      const container = containerRef.current;
      if (activeTab && container) {
        const containerRect = container.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        setSliderPosition({
          left: tabRect.left - containerRect.left,
          width: tabRect.width,
        });
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(updateSliderPosition, 10);
    return () => clearTimeout(timer);
  }, [activeIndex, options.length]);

  return (
    <Box ref={containerRef} sx={frameworkTabsContainerStyle(height)}>
      {/* Sliding background */}
      <Box sx={getSliderStyle(sliderPosition)} />

      {/* Button options */}
      {options.map((option, index) => (
        <Box
          key={option.value}
          ref={(el: HTMLDivElement | null) => { tabRefs.current[index] = el; }}
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
