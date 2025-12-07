import React from "react";
import { IconButton } from "@mui/material";
import { Info as GreyCircleInfoIcon } from "lucide-react";
import { useUserGuideSidebarContext } from "../UserGuide";

interface HelperIconProps {
  /** @deprecated Use articlePath instead - onClick will be removed in future versions */
  onClick?: () => void;
  /** Path to the User Guide article (e.g., "ai-governance/model-inventory") */
  articlePath?: string;
  size?: "small" | "medium" | "large";
}

const HelperIcon: React.FC<HelperIconProps> = ({ onClick, articlePath, size = "small" }) => {
  const userGuideSidebar = useUserGuideSidebarContext();

  const handleClick = () => {
    if (articlePath) {
      // Open User Guide sidebar to the specific article
      userGuideSidebar.open(articlePath);
    } else if (onClick) {
      // Fallback to legacy onClick behavior
      onClick();
    }
  };

  return (
    <IconButton
      disableRipple
      onClick={handleClick}
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
      <GreyCircleInfoIcon size={16} />
    </IconButton>
  );
};

export default HelperIcon;
