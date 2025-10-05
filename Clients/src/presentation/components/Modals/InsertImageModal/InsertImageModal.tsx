import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";

interface InsertImageModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (url: string, alt?: string) => void;
}

const InsertImageModal: React.FC<InsertImageModalProps> = ({
  open,
  onClose,
  onInsert,
}) => {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");

  const handleInsert = () => {
    if (url.trim() !== "") {
      onInsert(url.trim(), alt.trim());
      setUrl("");
      setAlt("");
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
        <ImageIcon color="primary" /> Insert Image
      </DialogTitle>

      <DialogContent>
        <TextField
          label="Image URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          fullWidth
          variant="outlined"
          margin="dense"
          autoFocus
        />
        <TextField
          label="Alt Text (optional)"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
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

export default InsertImageModal;
