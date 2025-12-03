/**
 * A modal component that displays a confirmation dialog for deleting/archiving items.
 *
 * @component
 * @param {BasicModalProps} props - The properties for the BasicModal component.
 * @param {boolean} props.isOpen - A boolean indicating whether the modal is open.
 * @param {function} props.setIsOpen - A function to set the modal's open state.
 *
 * @returns {JSX.Element} The rendered modal component.
 *
 * @example
 * <BasicModal isOpen={isOpen} setIsOpen={setIsOpen} />
 */

import { Button, Modal, Stack, Typography, useTheme, CircularProgress } from "@mui/material";
import { BasicModalProps } from "../../../../domain/interfaces/iSelect";
import {
  BasicModalCancelButtonStyle,
  BasicModalDeleteButtonStyle,
} from "./style";
import { useModalKeyHandling } from "../../../../application/hooks/useModalKeyHandling";
import { useState } from "react";

const BasicModal: React.FC<BasicModalProps> = ({
  isOpen,
  setIsOpen,
  onDelete,
  onCancel,
  warningTitle,
  warningMessage,
  type,
}) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  useModalKeyHandling({
    isOpen,
    onClose: () => !isLoading && setIsOpen(false),
  });

  const handleDelete = async (e: React.MouseEvent) => {
    setIsLoading(true);
    try {
      await onDelete(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    if (!isLoading) {
      onCancel(e);
    }
  };

  // Determine the action type and button styling
  const isArchiveAction = type === "Incident" || type === "Task";
  const isHardDelete = warningTitle?.toLowerCase().includes("permanently") || warningTitle?.toLowerCase().includes("delete");
  const buttonColor = isArchiveAction && !isHardDelete ? "warning" : "error";
  const buttonText = isArchiveAction ? `Archive ${type.toLowerCase()}` : (isHardDelete ? "Delete permanently" : `Delete ${type}`);

  return (
    <Modal
      open={isOpen}
      onClose={(_event, reason) => {
        if (reason !== "backdropClick" && !isLoading) {
          setIsOpen(false);
        }
      }}
    >
      <Stack
        gap={theme.spacing(2)}
        color={theme.palette.text.secondary}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 480,
          maxWidth: "90vw",
          bgcolor: theme.palette.background.modal,
          border: `1px solid ${theme.palette.border.light}`,
          borderRadius: theme.shape.borderRadius,
          boxShadow: 24,
          p: theme.spacing(3),
          "&:focus": {
            outline: "none",
          },
        }}
      >
        <Typography
          id="modal-delete-vendor"
          fontSize={16}
          fontWeight={600}
          color={theme.palette.text.primary}
        >
          {warningTitle}
        </Typography>
        <Typography
          id="delete-monitor-confirmation"
          fontSize={13}
          textAlign={"left"}
          color={theme.palette.text.secondary}
          sx={{ lineHeight: 1.5 }}
        >
          {warningMessage}
        </Typography>
        <Stack
          direction="row"
          gap={theme.spacing(2)}
          mt={theme.spacing(4)}
          justifyContent="flex-end"
        >
          <Button
            disableRipple
            disableFocusRipple
            disableTouchRipple
            variant="text"
            color="inherit"
            onClick={handleCancel}
            disabled={isLoading}
            sx={{
              ...BasicModalCancelButtonStyle,
              opacity: isLoading ? 0.5 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </Button>
          <Button
            disableRipple
            disableFocusRipple
            disableTouchRipple
            variant="contained"
            color={buttonColor}
            sx={{
              ...BasicModalDeleteButtonStyle,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <CircularProgress size={16} color="inherit" />}
            {buttonText}
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
};

export default BasicModal;
