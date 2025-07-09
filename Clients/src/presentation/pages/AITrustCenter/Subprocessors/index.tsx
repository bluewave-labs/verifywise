import React from "react";
import { Box, Typography } from "@mui/material";
import { useStyles } from './styles';

const AITrustCenterSubprocessors: React.FC = () => {
  const styles = useStyles();

  return (
    <Box>
      <Typography variant="h6" sx={styles.title}>
        Subprocessors
      </Typography>
      <Typography sx={styles.description}>
        This section will contain information about AI subprocessors and third-party services.
      </Typography>
      {/* Add your subprocessors content here */}
    </Box>
  );
};

export default AITrustCenterSubprocessors; 