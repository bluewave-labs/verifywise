// components/modals/InsertLinkModal.tsx
import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from "@mui/material";

export const InsertLinkModal = ({ open, onClose, onInsert }: any) => {
  const [url, setUrl] = useState("");

  const handleInsert = () => {
    onInsert({ url });
    setUrl("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Insert Link</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="URL"
          fullWidth
          variant="outlined"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleInsert} variant="contained">Insert</Button>
      </DialogActions>
    </Dialog>
  );
};
