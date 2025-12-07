import React from "react";
import { IconButton } from "@mui/material";
import { Info as GreyCircleInfoIcon } from "lucide-react";
import { useUserGuideSidebarContext } from "../UserGuide";

interface HelperIconProps {
  /** Path to the User Guide article (e.g., "ai-governance/model-inventory") */
  articlePath: string;
  size?: "small" | "medium" | "large";
}

const HelperIcon: React.FC<HelperIconProps> = ({ articlePath, size = "small" }) => {
  const userGuideSidebar = useUserGuideSidebarContext();

  const handleClick = () => {
    userGuideSidebar.open(articlePath);
  };

  return (
    <IconButton
      disableRipple
      onClick={handleClick}
      aria-label="Open help information"
      size={size}
      sx={{
        color: "#9CA3AF",
        backgroundColor: "transparent",
        padding: "4px",
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
