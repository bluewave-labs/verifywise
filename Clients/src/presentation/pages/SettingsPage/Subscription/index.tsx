import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { Mail } from "lucide-react";

const Subscription: React.FC = () => {
  return (
    <Box sx={{ mt: 3, px: 3, maxWidth: "100%" }}>
      <Stack spacing={3}>
        <Typography
          component="h1"
          sx={{
            fontSize: 16,
            color: "#2D3748",
            fontWeight: 600,
          }}
        >
          Subscription
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
            p: 3,
            backgroundColor: "#F9FAFB",
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
          }}
        >
          <Mail size={20} color="#6B7280" style={{ marginTop: 2 }} />
          <Typography
            variant="body1"
            sx={{
              fontSize: 13,
              color: "#374151",
              lineHeight: 1.6,
            }}
          >
            If you want to start a subscription of the SaaS platform, or looking for on-premise, air-gapped deployment, please{" "}
            <Typography
              component="a"
              href="https://verifywise.ai/contact"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: "#13715B",
                textDecoration: "underline",
                fontSize: 13,
                "&:hover": {
                  textDecoration: "none",
                },
              }}
            >
              contact us
            </Typography>
            .
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

export default Subscription;
