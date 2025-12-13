import CustomizableButton from "../../Button/CustomizableButton";
import "./index.css";
import { Stack, SxProps, Theme, Typography } from "@mui/material";
import {useModalKeyHandling} from "../../../../application/hooks/useModalKeyHandling";

interface ConfirmationModalProps {
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
  confirmBtnSx?: SxProps<Theme> | undefined;
  isOpen?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  body,
  cancelText,
  proceedText,
  onCancel,
  onProceed,
  proceedButtonColor,
  proceedButtonVariant,
  TitleFontSize,
  confirmBtnSx,
  isOpen = true,
}) => {
  useModalKeyHandling({
    isOpen,
    onClose: onCancel,
  });

  if (!isOpen) return null;

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
        className="confirmation-modal"
        sx={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1300,
          backgroundColor: "white",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          maxWidth: "440px",
        }}
      >
        <Stack className="confirmation-modal-content">
          <Typography className="confirmation-modal-title" fontSize={TitleFontSize}>
            {title}
          </Typography>
          {body}
        </Stack>
        <Stack
          className="confirmation-modal-actions"
          sx={{
            display: "flex",
          }}
        >
          <CustomizableButton
            text={cancelText}
            variant="text"
            sx={{ color: "#344054", px: "32px", width: 120 }}
            onClick={onCancel}
          />
          <CustomizableButton
            text={proceedText}
            color={proceedButtonColor}
            variant={proceedButtonVariant}
            onClick={onProceed}
            sx={confirmBtnSx}
          />
        </Stack>
      </Stack>
    </>
  );
};

export default ConfirmationModal;
