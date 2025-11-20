import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import CustomizableButton from "../Button/CustomizableButton";
import { SKIP_CONFIRMATION_TEXT } from "./onboardingConstants";

interface SkipConfirmationProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const SkipConfirmation: React.FC<SkipConfirmationProps> = ({
  open,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
    >
      <Box
        sx={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: 6,
          maxWidth: "400px",
          width: "90%",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: "16px",
            marginBottom: 2,
          }}
        >
          {SKIP_CONFIRMATION_TEXT.title}
        </Typography>
        <Typography
          sx={{
            fontSize: "13px",
            color: "#667085",
            marginBottom: 4,
          }}
        >
          {SKIP_CONFIRMATION_TEXT.message}
        </Typography>
        <Stack direction="row" gap={2} justifyContent="flex-end">
          <CustomizableButton
            variant="outlined"
            text={SKIP_CONFIRMATION_TEXT.cancelButton}
            onClick={onCancel}
            sx={{
              borderColor: "#D0D5DD",
              color: "#344054",
              "&:hover": {
                borderColor: "#98A2B3",
              },
            }}
          />
          <CustomizableButton
            variant="contained"
            text={SKIP_CONFIRMATION_TEXT.confirmButton}
            onClick={onConfirm}
            sx={{
              backgroundColor: "#DC6803",
              "&:hover": {
                backgroundColor: "#B54708",
              },
            }}
          />
        </Stack>
      </Box>
    </Box>
  );
};

export default SkipConfirmation;
