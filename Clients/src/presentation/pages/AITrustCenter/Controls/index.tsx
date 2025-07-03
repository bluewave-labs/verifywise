import React from "react";
import { Box, Typography } from "@mui/material";
import { useStyles } from './styles';

const AITrustCenterControls: React.FC = () => {
  const styles = useStyles();

  return (
    <Box>
      <Typography variant="h6" sx={styles.title}>
        Controls
      </Typography>
      <Typography sx={styles.description}>
        This section will contain AI controls and governance information.
      </Typography>
      {/* Add your controls content here */}
    </Box>
  );
};

export default AITrustCenterControls; 