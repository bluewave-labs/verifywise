import { useState } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { MessageSquare } from "lucide-react";
import palette from "../../../themes/palette";

export default function PlaygroundPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Box mb={3}>
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: palette.text.primary }}>
          Playground
        </Typography>
        <Typography sx={{ fontSize: 13, color: palette.text.tertiary, mt: 0.5 }}>
          Test your configured endpoints with an interactive chat interface
        </Typography>
      </Box>

      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          py: 8,
          border: `1px solid ${palette.border.dark}`,
          borderRadius: "4px",
          backgroundColor: palette.background.alt,
        }}
      >
        <MessageSquare size={32} color={palette.text.disabled} strokeWidth={1.5} />
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: palette.text.primary, mt: 2 }}>
          Playground coming soon
        </Typography>
        <Typography sx={{ fontSize: 13, color: palette.text.tertiary, mt: 0.5 }}>
          Configure at least one endpoint to start testing
        </Typography>
      </Stack>
    </Box>
  );
}
