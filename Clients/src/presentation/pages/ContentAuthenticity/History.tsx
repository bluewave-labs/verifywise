/**
 * @fileoverview Content Authenticity History Page
 *
 * Displays history of watermark embed/detect operations.
 *
 * @module pages/ContentAuthenticity/History
 */

import { Box, Typography, Stack, Paper } from "@mui/material";
import { History as HistoryIcon } from "lucide-react";

export default function History() {
  return (
    <Box sx={{ p: 3, maxWidth: 1200 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View your watermark embedding and detection history.
          </Typography>
        </Box>

        {/* Placeholder for empty state */}
        <Paper
          variant="outlined"
          sx={{
            p: 6,
            textAlign: "center",
          }}
        >
          <HistoryIcon size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No history yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your watermark embedding and detection history will appear here.
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
