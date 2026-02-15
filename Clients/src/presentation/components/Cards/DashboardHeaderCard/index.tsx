import { useState, ReactNode } from "react";

import { Stack, Typography, Box, useTheme } from "@mui/material";
import { ArrowRight as RightArrow } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderCardProps {
  title: string;
  count: ReactNode;
  disableNavigation?: boolean;
  icon?: ReactNode;
  navigateTo?: string;
}

export function DashboardHeaderCard({ title, count, disableNavigation = false, icon, navigateTo }: HeaderCardProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const getNavigationPath = (cardTitle: string): string | null => {
    // If navigateTo is provided, use it directly
    if (navigateTo) return navigateTo;

    switch (cardTitle) {
      case "Trainings":
        return "/training";
      case "Models":
        return "/model-inventory";
      case "Reports":
        return "/reporting";
      default:
        return null;
    }
  };

  const navigationPath = getNavigationPath(title);
  const isClickable = navigationPath !== null && !disableNavigation;

  const handleClick = () => {
    if (navigationPath) {
      navigate(navigationPath);
    }
  };

  return (
    <Stack
      sx={{
        border: `1px solid ${theme.palette.border.dark}`,
        borderRadius: 2,
        background: `linear-gradient(135deg, ${theme.palette.background.main} 0%, ${theme.palette.background.subtle} 100%)`,
        width: "100%",
        padding: "8px 36px 14px 14px",
        cursor: isClickable ? "pointer" : "default",
        position: "relative",
        overflow: "visible",
        transition: "all 0.2s ease",
        "&:hover": isClickable
          ? {
            background: `linear-gradient(135deg, ${theme.palette.background.accent} 0%, ${theme.palette.background.hover} 100%)`,
            borderColor: theme.palette.border.dark,
          }
          : {},
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <Typography
        sx={{
          fontSize: 13,
          color: theme.palette.text.accent,
          pb: "2px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 1,
          minHeight: 32,
          fontWeight: 600,
          fontSize: 15,
          color: theme.palette.text.primary,
          wordBreak: "break-word",
        }}
      >
        {count}
      </Typography>

      {icon ? (
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            color: theme.palette.text.accent,
          }}
        >
          {icon}
        </Box>
      ) : isClickable ? (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            opacity: isHovered ? 1 : 0.3,
            transition: "opacity 0.2s ease",
          }}
        >
          <RightArrow size={16} />
        </Box>
      ) : null}
    </Stack>
  );
}
