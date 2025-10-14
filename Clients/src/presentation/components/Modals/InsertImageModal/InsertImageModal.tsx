import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import Field from "../../Inputs/Field"; // Adjust the path to your actual Field component
import CustomizableButton from "../../Button/CustomizableButton"; // Adjust the path as needed

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
      <DialogTitle>
        Insert image
      </DialogTitle>

      <DialogContent>
        <Field
          label="Image URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          type="text"
          placeholder="https://image-url"
          isRequired
          sx={{ mb: 2 }} // Custom styles for spacing
        />
        <Field
          label="Image description (optional)"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          type="text"
          placeholder="Enter the image description (optional)"
          sx={{ mb: 2, mt: 1 }} // Custom styles for spacing
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

export default InsertImageModal;
