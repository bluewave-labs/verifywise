import React, { useState, useRef } from "react";
import { Box, Typography, Popover, IconButton } from "@mui/material";

interface EnhancedTooltipProps {
  children: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  children,
  title,
  content,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    // Don't auto-close - user must click the close button or leave the popover
  };

  const handlePopoverEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handlePopoverLeave = () => {
    setAnchorEl(null);
  };

  const handleCloseClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(null);
  };

  return (
    <>
      <Box
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        sx={{ display: "inline-block" }}
      >
        {children}
      </Box>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handlePopoverLeave}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        disableRestoreFocus
        sx={{
          pointerEvents: "auto",
          "& .MuiPopover-paper": {
            borderRadius: "4px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            maxWidth: "420px",
          },
        }}
        slotProps={{
          paper: {
            onMouseEnter: handlePopoverEnter,
            onMouseLeave: handlePopoverLeave,
          },
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #1f1f23 0%, #252530 100%)",
            padding: "24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <IconButton
            onClick={handleCloseClick}
            size="small"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "rgba(255, 255, 255, 0.6)",
              "&:hover": {
                color: "#ffffff",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: "15px",
              color: "#ffffff",
              letterSpacing: "-0.02em",
              mb: 2,
              pr: 3,
            }}
          >
            {title}
          </Typography>
          <Box
            sx={{
              height: "1px",
              background: "rgba(255, 255, 255, 0.1)",
              mb: 2,
            }}
          />
          <Box
            sx={{
              color: "rgba(255, 255, 255, 0.85)",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            {content}
          </Box>
          <Box
            sx={{
              position: "absolute",
              bottom: -30,
              right: -30,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(19, 113, 91, 0.2) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
        </Box>
      </Popover>
    </>
  );
};

export default EnhancedTooltip;
