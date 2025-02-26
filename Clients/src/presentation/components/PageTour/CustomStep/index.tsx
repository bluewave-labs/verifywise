import React from "react";
import { Box, Typography } from "@mui/material";

interface CustomStepProps {
  header?: string;
  body: string;
}

const CustomStep: React.FC<CustomStepProps> = ({ header, body }) => (
  <Box sx={{ textAlign: "left" }}>
    <Typography
      variant="h6"
      sx={{ fontWeight: "bold", mb: 1, fontSize: "16px" }}
    >
      {header}
    </Typography>
    <Typography
      variant="body2"
      sx={{ color: "text.secondary", fontSize: "13px" }}
    >
      {body}
    </Typography>
  </Box>
);

export default CustomStep;
