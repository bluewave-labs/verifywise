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
}) => {
  return (
    <Stack className="dual-btn-modal">
      <Stack className="dual-btn-modal-content">
        <Typography className="dual-btn-modal-title">{title}</Typography>
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
          sx={{
            width: 120,
          }}
          onClick={onProceed}
        />
      </Stack>
    </Stack>
  );
};

export default DualButtonModal;
