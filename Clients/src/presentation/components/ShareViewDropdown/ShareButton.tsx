import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import { Share2 } from "lucide-react";

/**
 * Props for the ShareButton component
 */
export interface ShareButtonProps {
  /** Callback when the button is clicked */
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Size of the button */
  size?: "small" | "medium" | "large";
  /** Tooltip text */
  tooltip?: string;
}

/**
 * ShareButton component - Trigger button for the ShareViewDropdown
 * Displays a share icon button with consistent styling
 */
const ShareButton: React.FC<ShareButtonProps> = ({
  onClick,
  disabled = false,
  size = "medium",
  tooltip = "Share view",
}) => {
  const iconSize = size === "small" ? 16 : size === "large" ? 22 : 20;

  return (
    <Tooltip title={tooltip} arrow>
      <span>
        <IconButton
          onClick={onClick}
          disabled={disabled}
          size={size}
          sx={{
            color: "#13715B",
            backgroundColor: "transparent",
            border: "1px solid #d0d5dd",
            borderRadius: "4px",
            padding: size === "small" ? "6px" : size === "large" ? "10px" : "6px",
            width: size === "small" ? "32px" : size === "large" ? "44px" : "34px",
            height: size === "small" ? "32px" : size === "large" ? "44px" : "34px",
            "&:hover": {
              backgroundColor: "rgba(19, 113, 91, 0.08)",
              borderColor: "#13715B",
            },
            "&:disabled": {
              color: "#d1d5db",
              borderColor: "#e5e7eb",
              backgroundColor: "#f9fafb",
            },
            transition: "all 0.2s ease",
          }}
        >
          <Share2 size={iconSize} strokeWidth={1.5} />
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default ShareButton;
