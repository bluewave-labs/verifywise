import { Stack, Typography, Box, useTheme } from "@mui/material";
import { descCardbodyStyle, infoCardStyle, infoCardTitleStyle } from "../DescriptionCard/style";
import { ReactNode } from "react";

interface TeamCardProps {
  title: string;
  members?: string[];
  icon?: ReactNode;
}

export function TeamCard({
  title,
  members = ["Mohammad Khalilzadeh", "Gorkem Cetin", "Eiei mon"],
  icon,
}: TeamCardProps) {
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
      {members.length !== 0 ?
        <Typography sx={descCardbodyStyle(theme)}>{members.join(", ")}</Typography>
      :
        <Typography sx={descCardbodyStyle(theme)}>No members have been assigned to the use case</Typography>
      }
    </Stack>
  );
}
