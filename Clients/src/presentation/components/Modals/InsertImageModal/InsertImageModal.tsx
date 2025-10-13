import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
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
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ImageIcon color="primary" /> Insert Image
      </DialogTitle>

      <DialogContent>
        <Field
          label="Image URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          type="url"
          https
          placeholder="Enter the image URL"
          isRequired
          sx={{ mb: 2 }} // Custom styles for spacing
        />
        <Field
          label="Alt Text (optional)"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          type="text"
          placeholder="Enter the alt text (optional)"
          sx={{ mb: 2 }} // Custom styles for spacing
        />
      </DialogContent>

      <DialogActions sx={{ padding: 2 }}>
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
