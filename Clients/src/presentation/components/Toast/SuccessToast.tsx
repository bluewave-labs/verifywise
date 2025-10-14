import React from "react";
import { Snackbar, Alert } from "@mui/material";
import { CheckCircle } from "lucide-react";

interface SuccessToastProps {
  open: boolean;
  message: string;
  onClose: () => void;
  autoHideDuration?: number;
}

const SuccessToast: React.FC<SuccessToastProps> = ({
  open,
  message,
  onClose,
  autoHideDuration = 4000,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      sx={{
        "& .MuiSnackbarContent-root": {
          minWidth: "300px",
        },
      }}
    >
      <Alert
        onClose={onClose}
        severity="success"
        variant="filled"
        icon={<CheckCircle size={20} />}
        sx={{
          backgroundColor: "#13715B",
          color: "#FFFFFF",
          fontSize: "14px",
          fontWeight: 500,
          borderRadius: "6px",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
          "& .MuiAlert-icon": {
            color: "#FFFFFF",
          },
          "& .MuiAlert-action": {
            color: "#FFFFFF",
          },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default SuccessToast;