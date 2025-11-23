import { useState, useEffect } from "react";
import { Box, Typography, IconButton, useTheme } from "@mui/material";
import { X, Info } from "lucide-react";

interface InfoBoxProps {
  message: string;
  storageKey: string; // Unique key for localStorage to track dismissal
}

const InfoBox = ({ message, storageKey }: InfoBoxProps) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(true);

  // Check if this info box has been dismissed before
  useEffect(() => {
    const dismissed = localStorage.getItem(`infoBox_${storageKey}`);
    if (dismissed === "true") {
      setIsVisible(false);
    }
  }, [storageKey]);

  const handleClose = () => {
    // Save dismissal to localStorage
    localStorage.setItem(`infoBox_${storageKey}`, "true");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 13,
        color: theme.palette.text.secondary,
        backgroundColor: theme.palette.background.paper,
        padding: "12px 16px",
        borderRadius: "4px",
        border: `1px solid ${theme.palette.divider}`,
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
        <Info size={18} strokeWidth={2} color={theme.palette.info.main} />
        <Typography
          sx={{
            fontSize: 13,
            color: theme.palette.text.secondary,
          }}
        >
          {message}
        </Typography>
      </Box>
      <IconButton
        onClick={handleClose}
        size="small"
        sx={{
          padding: "4px",
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <X size={16} strokeWidth={2} />
      </IconButton>
    </Box>
  );
};

export default InfoBox;
