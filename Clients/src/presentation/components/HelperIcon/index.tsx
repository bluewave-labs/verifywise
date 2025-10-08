import React from "react";
import { IconButton } from "@mui/material";
import { Info as GreyCircleInfoIcon } from "lucide-react";

interface HelperIconProps {
  onClick: () => void;
  size?: "small" | "medium" | "large";
}

const HelperIcon: React.FC<HelperIconProps> = ({ onClick, size = "small" }) => {
  return (
    <IconButton
      disableRipple
      onClick={onClick}
      aria-label="Open help information"
      size={size}
      sx={{
        color: "#9CA3AF", // Lighter gray
        backgroundColor: "transparent",
        padding: "4px", // Smaller padding for smaller icon
        "&:hover": {
          backgroundColor: "rgba(156, 163, 175, 0.1)",
        },
      }}
    >
      <GreyCircleInfoIcon size={20} />
    </IconButton>
  );
};

export default HelperIcon;
