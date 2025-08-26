import React from "react";
import {
  Box,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import IntegrationsGrid from "./IntegrationsGrid";

const IntegrationsOverview: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack className="vwhome" gap={theme.spacing(20)}>
      {/* Header */}
      <Stack gap={theme.spacing(8)}>
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 600,
            color: "#1A1919",
            marginBottom: theme.spacing(8),
          }}
        >
          Integrations
        </Typography>
        <Typography
          sx={{
            fontSize: 13,
            color: "#344054",
          }}
        >
          Connect your tools to VerifyWise
        </Typography>
      </Stack>

      <Box>
        <IntegrationsGrid />
      </Box>
    </Stack>
  );
};

export default IntegrationsOverview;