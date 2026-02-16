import { ReactNode } from "react";

import { Stack, Typography, Box, IconButton, Tooltip, useTheme } from "@mui/material";

import { infoCardbodyStyle, infoCardStyle, infoCardTitleStyle } from "./style";

interface InfoCardProps {
  title: string;
  body: string;
  icon?: ReactNode;
  actionIcon?: ReactNode;
  actionTooltip?: string;
  onActionClick?: () => void;
  isActionActive?: boolean;
}

export function InfoCard({
  title,
  body,
  icon,
  actionIcon,
  actionTooltip,
  onActionClick,
  isActionActive = false
}: InfoCardProps) {
  const theme = useTheme();
  return (
    <Stack sx={infoCardStyle(theme)}>
      {icon && !actionIcon && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: theme.palette.text.accent,
            opacity: 0.7,
          }}
        >
          {icon}
        </Box>
      )}
      {actionIcon && onActionClick && (
        <Tooltip title={actionTooltip || ""} arrow>
          <IconButton
            onClick={onActionClick}
            size="small"
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              color: isActionActive ? theme.palette.primary.main : theme.palette.text.muted,
              padding: "4px",
              borderRadius: "4px",
              backgroundColor: isActionActive ? `${theme.palette.primary.main}15` : "transparent",
              "&:hover": {
                backgroundColor: isActionActive ? `${theme.palette.primary.main}20` : theme.palette.background.subtle,
              },
            }}
          >
            {actionIcon}
          </IconButton>
        </Tooltip>
      )}
      <Typography sx={infoCardTitleStyle(theme)}>{title}</Typography>
      <Typography sx={infoCardbodyStyle(theme)}>{body}</Typography>
    </Stack>
  );
}
