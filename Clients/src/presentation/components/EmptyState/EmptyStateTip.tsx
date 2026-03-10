import type { FC } from "react";
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
 * Uses native <details> for accessible expand/collapse.
 */
const EmptyStateTip: FC<EmptyStateTipProps> = ({
  icon: Icon,
  title,
  description,
}) => {
  const theme = useTheme();

  return (
    <Box
      component="details"
      sx={{
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: "4px",
        overflow: "hidden",
        "&[open] .tip-chevron": {
          transform: "rotate(90deg)",
        },
        "&[open] .tip-summary": {
          borderBottom: `1px solid ${theme.palette.border.light}`,
        },
      }}
    >
      <Box
        component="summary"
        className="tip-summary"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
          cursor: "pointer",
          listStyle: "none",
          userSelect: "none",
          backgroundColor: theme.palette.background.main,
          transition: "background-color 150ms ease",
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
          className="tip-chevron"
          size={14}
          color={theme.palette.text.tertiary}
          style={{ transition: "transform 150ms ease", flexShrink: 0 }}
        />
      </Box>
      <Box
        sx={{
          padding: "12px 14px 12px 52px",
          backgroundColor: theme.palette.background.main,
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            color: theme.palette.text.secondary,
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  );
};

export default EmptyStateTip;
