import React from "react";
import { Box, Typography } from "@mui/material";

const TrustCenterResources: React.FC = () => {
  const titleStyle = {
    fontSize: 18,
    fontWeight: 600,
    color: "#1A1919",
    mb: 2,
  };

  const descriptionStyle = {
    fontSize: 14,
    color: "#344054",
    mb: 3,
  };

  return (
    <Box>
      <Typography variant="h6" sx={titleStyle}>
        Resources
      </Typography>
      <Typography sx={descriptionStyle}>
        This section will contain resources related to AI trust and compliance.
      </Typography>
      {/* Add your resources content here */}
    </Box>
  );
};

export default TrustCenterResources; 