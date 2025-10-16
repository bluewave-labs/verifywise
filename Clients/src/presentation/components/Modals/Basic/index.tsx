/**
 * A modal component that displays a confirmation dialog for deleting a vendor.
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

import { Button, Modal, Stack, Typography, useTheme } from "@mui/material";
import { BasicModalProps } from "../../../../domain/interfaces/iSelect";
import {
  BasicModalCancelButtonStyle,
  BasicModalDeleteButtonStyle,
} from "./style";
import { useModalKeyHandling } from "../../../../application/hooks/useModalKeyHandling";

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

  useModalKeyHandling({
    isOpen,
    onClose: () => setIsOpen(false)
  });

  return (
    <Modal
      open={isOpen}
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick') {
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
          width: 450,
          bgcolor: theme.palette.background.modal,
          border: 1,
          borderColor: theme.palette.border.dark,
          borderRadius: theme.shape.borderRadius,
          boxShadow: 24,
          p: theme.spacing(15),
          "&:focus": {
            outline: "none",
          },
        }}
      >
        <Typography
          id="modal-delete-vendor"
          fontSize={16}
          fontWeight={600}
        >
          {warningTitle}
        </Typography>
        <Typography
          id="delete-monitor-confirmation"
          fontSize={13}
          textAlign={"left"}
        >
          {warningMessage}
        </Typography>
        <Stack
          direction="row"
          gap={theme.spacing(4)}
          mt={theme.spacing(12)}
          justifyContent="flex-end"
        >
          <Button
            disableRipple
            disableFocusRipple
            disableTouchRipple
            variant="text"
            color="inherit"
            onClick={(e) => onCancel(e)}
            sx={BasicModalCancelButtonStyle}
          >
            Cancel
          </Button>
          <Button
            disableRipple
            disableFocusRipple
            disableTouchRipple
            variant="contained"
            color="error"
            sx={BasicModalDeleteButtonStyle}
            onClick={(e) => onDelete(e)}
          >
            {`Delete ${type}`}
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
};

export default BasicModal;
