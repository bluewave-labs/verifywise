import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box
} from "@mui/material";
import singleTheme from "../../../themes/v1SingleTheme";

interface Props {
  id: number;
  onConfirm: (id: number) => void;
  title?: string;
  message?: string;
  customIcon?: React.ReactNode; // e.g., your <img src={trash} ... />
}

const ConfirmableDeleteIconButton: React.FC<Props> = ({
  id,
  onConfirm,
  title = "Delete this item?",
  message = "This action is non-recoverable.",
  customIcon
}) => {
  const [open, setOpen] = useState(false);
  const COLOR = "#344054";

  return (
    <>
      <IconButton onClick={() => setOpen(true)} sx={{ padding: 0, ml: 5 }}>
        {customIcon}
      </IconButton>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle sx={{ fontWeight: 600, fontSize: "16px", color: COLOR }}>
          <strong>{title}</strong>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "14px", color: COLOR }}>{message}</Typography>
        </DialogContent>
        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "right",
            gap: 2,
            px: 5,
            pb: 3,
            pt: 0,
          }}
        >
          <Button
            onClick={() => setOpen(false)}
            variant="text"
            disableFocusRipple
            disableRipple
            sx={{
              textTransform: "none",
              fontSize: "14px",
              color: "#344054",
              px: 3,
              py: 1.5,
              '&:focus': { outline: 'none' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm?.(id);
              setOpen(false);
            }}
            variant="contained"
            sx={{
              ...singleTheme.buttons.error.contained,
              px: 3,
              py: 1.5,
              minWidth: "120px"
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ConfirmableDeleteIconButton;
