// components/modals/InsertImageModal.tsx
import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from "@mui/material";

export const InsertImageModal = ({ open, onClose, onInsert }: any) => {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");

  const handleInsert = () => {
    onInsert({ url, alt });
    setUrl("");
    setAlt("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Insert Image</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Image URL"
          fullWidth
          variant="outlined"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Alt Text"
          fullWidth
          variant="outlined"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleInsert} variant="contained">Insert</Button>
      </DialogActions>
    </Dialog>
  );
};
