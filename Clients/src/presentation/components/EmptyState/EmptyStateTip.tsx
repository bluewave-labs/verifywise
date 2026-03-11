import { type FC, useRef, useState, useEffect, useCallback } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

interface EmptyStateTipProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Collapsible tip block for empty states.
 * Uses native <details> with animated height transition.
 */
const EmptyStateTip: FC<EmptyStateTipProps> = ({
  icon: Icon,
  title,
  description,
}) => {
  const theme = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [description]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const details = detailsRef.current;
    if (!details) return;

    if (isOpen) {
      setIsOpen(false);
      setTimeout(() => { details.open = false; }, 200);
    } else {
      details.open = true;
      requestAnimationFrame(() => setIsOpen(true));
    }
  }, [isOpen]);

  return (
    <Box
      component="details"
      ref={detailsRef}
      sx={{
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <Box
        component="summary"
        onClick={handleToggle}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
          cursor: "pointer",
          listStyle: "none",
          userSelect: "none",
          backgroundColor: theme.palette.background.main,
          borderBottom: isOpen
            ? `1px solid ${theme.palette.border.light}`
            : "1px solid transparent",
          transition: "background-color 150ms ease, border-color 200ms ease",
          "&:hover": {
            backgroundColor: theme.palette.background.fill,
          },
          "&::-webkit-details-marker": { display: "none" },
          "&::marker": { display: "none" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: "4px",
            backgroundColor: theme.palette.background.fill,
            flexShrink: 0,
          }}
        >
          <Icon size={14} color={theme.palette.text.secondary} />
        </Box>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 500,
            color: theme.palette.text.primary,
            flex: 1,
          }}
        >
          {title}
        </Typography>
        <ChevronRight
          size={14}
          color={theme.palette.text.tertiary}
          style={{
            transition: "transform 200ms ease",
            flexShrink: 0,
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
          }}
        />
      </Box>
      <Box
        sx={{
          height: isOpen ? contentHeight : 0,
          opacity: isOpen ? 1 : 0,
          overflow: "hidden",
          transition: "height 200ms ease, opacity 200ms ease",
        }}
      >
        <Box
          ref={contentRef}
          sx={{
            padding: "12px 14px 12px 52px",
            backgroundColor: theme.palette.background.main,
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
            }}
          >
            {description}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default EmptyStateTip;
