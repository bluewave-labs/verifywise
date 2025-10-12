import { Stack, Typography, Box } from "@mui/material";
import { infoCardbodyStyle, infoCardStyle, infoCardTitleStyle } from "./style";
import React from "react";

interface InfoCardProps {
  title: string;
  body: string;
  icon?: React.ReactNode;
}

const InfoCard = ({ title, body, icon }: InfoCardProps) => {
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
      <Typography sx={infoCardbodyStyle}>{body}</Typography>
    </Stack>
  );
};

export default InfoCard;
