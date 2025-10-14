import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import Field from "../../Inputs/Field";
import CustomizableButton from "../../Button/CustomizableButton";

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
      <DialogTitle>
        Insert link
      </DialogTitle>

      <DialogContent>
        <Field
          label="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          https
          placeholder="Enter the link URL"
          isRequired
          sx={{ mb: 2 }} 
        />
        <Field
          label="Display text (optional)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          type="text"
          placeholder="Enter the display text (optional)"
          sx={{ mb: 2, mt: 1 }}
        />
      </DialogContent>

      <DialogActions sx={{ padding: 2, justifyContent: "flex-end", gap: 2 }}>
        <CustomizableButton
          text="Cancel"
          variant="text"
          sx={{ color: "#344054", px: "32px", width: 120 }}
          onClick={onClose}
        />
        <CustomizableButton
          text="Insert"
          variant="contained"
          color="primary"
          sx={{ width: 120 }}
          onClick={handleInsert}
          isDisabled={!url.trim()}
        />
      </DialogActions>
    </Dialog>
  );
};

export default InsertLinkModal;
