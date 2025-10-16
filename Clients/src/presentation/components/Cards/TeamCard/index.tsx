import { Stack, Typography, Box } from "@mui/material";
import { descCardbodyStyle, infoCardStyle, infoCardTitleStyle } from "./style";
import React from "react";

interface TeamCardProps {
  title: string;
  members?: any[];
  icon?: React.ReactNode;
}

const TeamCard = ({
  title,
  members = ["Mohammad Khalilzadeh", "Gorkem Cetin", "Eiei mon"],
  icon,
}: TeamCardProps) => {
  return (
    <Stack sx={infoCardStyle}>
      {icon && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "#8594AC",
            opacity: 0.7,
          }}
        >
          {icon}
        </Box>
      )}
      <Typography sx={infoCardTitleStyle}>{title}</Typography>
      {members.length !== 0 ?
        <Typography sx={descCardbodyStyle}>{members.join(", ")}</Typography>
      :
        <Typography sx={descCardbodyStyle}>No members have been assigned to the use case</Typography>
      }
    </Stack>
  );
};

export default TeamCard;
