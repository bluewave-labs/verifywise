import { Stack, useTheme, IconButton } from "@mui/material";
import Uppy from "@uppy/core";
import { useState, useEffect } from "react";
import { Dashboard } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import VWButton from "../../Buttons";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";

interface UppyUploadFileProps {
  evidence_files: any[];
  onClose: () => void;
  onConfirm: (files: any[]) => void;
}

const UppyUploadFile: React.FC<UppyUploadFileProps> = ({
  evidence_files,
  onClose,
  onConfirm,
}) => {
  const theme = useTheme();
  const [uppy] = useState(() => new Uppy());
  const [files, setFiles] = useState(evidence_files || []);

  useEffect(() => {
    uppy.on("file-added", (file) => {
      setFiles((prevFiles) => [...prevFiles, file]);
    });

    uppy.on("file-removed", (file) => {
      setFiles((prevFiles) => prevFiles.filter((f) => f.id !== file.id));
    });

    return () => {
      uppy.cancelAll();
    };
  }, [uppy]);

  const handleRemoveFile = (fileId: string) => {
    uppy.removeFile(fileId);
    setFiles((prevFiles) => prevFiles.filter((f) => f.id !== fileId));
  };

  const handleConfirm = () => {
    onConfirm(files);
  };

  return (
    <Stack
      className="uppy-holder"
      sx={{
        gap: 10,
        alignItems: "center",
        padding: 10,
        border: 1,
        borderColor: theme.palette.border.light,
        borderRadius: theme.shape.borderRadius,
        backgroundColor: theme.palette.background.main,
      }}
    >
      <Stack
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          width: "100%",
        }}
      >
        <IconButton onClick={onClose}>
          <CloseIcon sx={{ width: 24, height: 24 }} />
        </IconButton>
      </Stack>
      <Dashboard uppy={uppy} width={400} height={250} />
      <Stack
        sx={{
          width: "100%",
          height: 100,
          padding: 2,
          border: 1,
          borderColor: theme.palette.border.light,
          borderRadius: theme.shape.borderRadius,
          backgroundColor: theme.palette.background.main,
          overflowY: "auto",
        }}
      >
        {files.map((file) => (
          <Stack
            key={file.id}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              padding: 1,
              borderBottom: "1px solid",
              borderColor: theme.palette.border.light,
            }}
          >
            <span>{file.name}</span>
            <IconButton onClick={() => handleRemoveFile(file.id)}>
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>
      <Stack
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 4,
          alignItems: "center",
        }}
      >
        <VWButton
          variant="contained"
          color="primary"
          size="small"
          text="Confirm"
          sx={{ width: 200 }}
          onClick={handleConfirm}
        />
      </Stack>
    </Stack>
  );
};

export default UppyUploadFile;
