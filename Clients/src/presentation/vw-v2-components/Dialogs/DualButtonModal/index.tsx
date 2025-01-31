import VWButton from "../../Buttons";
import "./index.css";
import { Stack, Typography } from "@mui/material";

interface DualButtonModalProps {
  title: string;
  body: React.ReactNode;
  cancelText: string;
  proceedText: string;
  onCancel: () => void;
  onProceed: () => void;
  proceedButtonColor?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "info";
  proceedButtonVariant: "contained" | "outlined" | "text";
  TitleFontSize?: number;
}

const DualButtonModal: React.FC<DualButtonModalProps> = ({
  title,
  body,
  cancelText,
  proceedText,
  onCancel,
  onProceed,
  proceedButtonColor,
  proceedButtonVariant,
  TitleFontSize,
}) => {
  return (
    <>
      <Stack
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1299,
        }}
      />
      <Stack
        className="dual-btn-modal"
        sx={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1300, // Ensure it appears on top of other components
          backgroundColor: "white",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          maxWidth: "440px",
        }}
      >
        <Stack className="dual-btn-modal-content">
          <Typography className="dual-btn-modal-title" fontSize={TitleFontSize}>
            {title}
          </Typography>
          {body}
        </Stack>
        <Stack
          className="dual-btn-modal-actions"
          sx={{
            display: "flex",
          }}
        >
          <VWButton
            text={cancelText}
            variant="text"
            sx={{ color: "#344054", px: "32px", width: 120 }}
            onClick={onCancel}
          />
          <VWButton
            text={proceedText}
            color={proceedButtonColor} // these are options : "primary" | "secondary" | "success" | "warning" | "error" | "info";
            variant={proceedButtonVariant} // these are the options : "contained" | "outlined" | "text"
            onClick={onProceed}
          />
        </Stack>
      </Stack>
    </>
  );
};

export default DualButtonModal;
