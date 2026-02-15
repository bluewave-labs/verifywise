import { ReactNode } from "react";

import { Stack, Typography, Box, useTheme } from "@mui/material";

import { descCardbodyStyle, infoCardStyle, infoCardTitleStyle } from "./style";

interface DescriptionCardProps {
  title: string;
  body: string;
  icon?: ReactNode;
}

export function DescriptionCard({ title, body, icon }: DescriptionCardProps) {
  const theme = useTheme();
  return (
    <Stack sx={infoCardStyle(theme)}>
      {icon && (
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
      <Typography sx={infoCardTitleStyle(theme)}>{title}</Typography>
      <Typography sx={descCardbodyStyle(theme)}>{body}</Typography>
    </Stack>
  );
}
