import { Stack, Typography, Box } from "@mui/material";
import { descCardbodyStyle, infoCardStyle, infoCardTitleStyle } from "./style";
import React from "react";

interface DescriptionCardProps {
  title: string;
  body: string;
  icon?: React.ReactNode;
}

const DescriptionCard = ({ title, body, icon }: DescriptionCardProps) => {
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
      <Typography sx={descCardbodyStyle}>{body}</Typography>
    </Stack>
  );
};

export default DescriptionCard;
