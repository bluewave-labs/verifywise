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

interface BasicModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const BasicModal: React.FC<BasicModalProps> = ({ isOpen, setIsOpen }) => {
  const theme = useTheme();
  return (
    <Modal open={isOpen} onClose={setIsOpen}>
      <Stack
        gap={theme.spacing(2)}
        color={theme.palette.text.secondary}
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 450,
          bgcolor: theme.palette.background.main,
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
        <Typography id="modal-delete-vendor" fontSize={16} fontWeight={600}>
          Delete this vendor?
        </Typography>
        <Typography
          id="delete-monitor-confirmation"
          fontSize={13}
          textAlign={"justify"}
        >
          When you delete this vendor, all data related to this vendor will be
          removed. This action is non-recoverable.
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
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            sx={{
              width: 100,
              textTransform: "capitalize",
              fontSize: 13,
              borderRadius: "4px",
              "&:hover": {
                boxShadow: "none",
                backgroundColor: "transparent",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            disableRipple
            disableFocusRipple
            disableTouchRipple
            variant="contained"
            color="error"
            sx={{
              width: 140,
              textTransform: "capitalize",
              fontSize: 13,
              backgroundColor: theme.palette.error.main,
              boxShadow: "none",
              borderRadius: "4px",
              "&:hover": {
                boxShadow: "none",
              },
            }}
          >
            Delete vendor
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
};

export default BasicModal;
