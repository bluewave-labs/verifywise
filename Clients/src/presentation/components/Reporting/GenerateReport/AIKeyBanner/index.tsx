import React from "react";
import { Box, Typography, Button, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";

interface AIKeyBannerProps {
  onClose: () => void;
}

const AIKeyBanner: React.FC<AIKeyBannerProps> = ({ onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleConfigureClick = () => {
    onClose();
    navigate("/settings/apikeys");
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        p: 2,
        borderRadius: "4px",
        backgroundColor: theme.palette.background.fill,
        border: `1px solid ${theme.palette.primary.main}`,
      }}
    >
      <Box sx={{ pt: 0.25, flexShrink: 0 }}>
        <Info size={16} color={theme.palette.primary.main} />
      </Box>
      <Box>
        <Typography
          sx={{
            fontSize: "13px",
            fontWeight: 500,
            color: theme.palette.text.primary,
            mb: 0.5,
          }}
        >
          Unlock AI-enhanced reports
        </Typography>
        <Typography
          sx={{
            fontSize: "12px",
            color: theme.palette.text.secondary,
            lineHeight: 1.5,
          }}
        >
          Configure an LLM key to generate reports with executive summaries, key
          findings, and recommendations.
        </Typography>
        <Button
          size="small"
          onClick={handleConfigureClick}
          sx={{
            textTransform: "none",
            fontSize: "12px",
            fontWeight: 600,
            color: theme.palette.primary.main,
            padding: 0,
            mt: 1,
            minWidth: "auto",
            "&:hover": {
              backgroundColor: "transparent",
              textDecoration: "underline",
            },
          }}
        >
          Configure LLM Key
        </Button>
      </Box>
    </Box>
  );
};

export default AIKeyBanner;
