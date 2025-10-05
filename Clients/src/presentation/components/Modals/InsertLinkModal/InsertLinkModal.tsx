import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";

interface InsertLinkModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (url: string, text?: string) => void;
}

const InsertLinkModal: React.FC<InsertLinkModalProps> = ({
  open,
  onClose,
  onInsert,
}) => {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  const handleInsert = () => {
    if (url.trim() !== "") {
      onInsert(url.trim(), text.trim());
      setUrl("");
      setText("");
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 1.5 },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <LinkIcon color="primary" /> Insert Link
      </DialogTitle>

      <DialogContent>
        <TextField
          label="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          fullWidth
          variant="outlined"
          margin="dense"
          autoFocus
        />
        <TextField
          label="Display Text (optional)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          fullWidth
          variant="outlined"
          margin="dense"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleInsert}
          color="primary"
          disabled={!url.trim()}
        >
          Insert
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InsertLinkModal;
