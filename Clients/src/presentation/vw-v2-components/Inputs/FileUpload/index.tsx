import {
  Stack,
  useTheme,
  IconButton,
  Typography,
  Link
} from "@mui/material";
import Uppy from "@uppy/core";
import { useState } from "react";
import { Dashboard } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { ENV_VARs } from "../../../../../env.vars";
import DeleteFileModal from "./DeleteFileModal";
import getStyles from "./getStyles";

interface FileData {
  id: string;
  fileName: string;
}

interface UppyUploadFileProps {
  uppy: Uppy;
  files: FileData[];
  onClose: () => void;
  onRemoveFile: (fileId: string) => void;
}

const FileListItem: React.FC<{
  file: FileData;
  onDeleteClick: (fileId: string, fileName: string) => void;
  styles: ReturnType<typeof getStyles>;
}> = ({ file, onDeleteClick, styles }) => (
  <Stack
    key={file.id}
    direction="row"
    justifyContent="space-between"
    alignItems="center"
    sx={styles.fileItem}
  >
    <Link
      href={`${ENV_VARs.URL}/files/${file.id}`}
      target="_blank"
      rel="noopener noreferrer"
      sx={styles.fileLink}
    >
      <Typography component="span" variant="body2" sx={styles.fileName}>
        {file.fileName}
      </Typography>
    </Link>
    <IconButton onClick={() => onDeleteClick(file.id, file.fileName)}>
      <DeleteIcon />
    </IconButton>
  </Stack>
);

const UppyUploadFile: React.FC<UppyUploadFileProps> = ({
  uppy,
  files,
  onClose,
  onRemoveFile,
}) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [deleteFileModal, setDeleteFileModal] = useState({
    isOpen: false,
    fileId: "",
    fileName: "",
  });

  const handleOpenDeleteFileModal = (fileId: string, fileName: string) => {
    setDeleteFileModal({ isOpen: true, fileId, fileName });
  };

  const handleCloseDeleteFileModal = () => {
    setDeleteFileModal({ isOpen: false, fileId: "", fileName: "" });
  };

  const handleDeleteFile = () => {
    onRemoveFile(deleteFileModal.fileId);
    handleCloseDeleteFileModal();
  };

  return (
    <Stack className="uppy-holder" sx={styles.container}>
      <Stack sx={styles.header}>
        <IconButton onClick={onClose}>
          <CloseIcon sx={{ width: 24, height: 24 }} />
        </IconButton>
      </Stack>

      <Dashboard uppy={uppy} width={400} height={250} />

      <Stack sx={styles.fileList}>
        {files.map((file) => (
          <FileListItem
            key={file.id}
            file={file}
            onDeleteClick={handleOpenDeleteFileModal}
            styles={styles}
          />
        ))}
      </Stack>

      <DeleteFileModal
        isOpen={deleteFileModal.isOpen}
        fileName={deleteFileModal.fileName}
        onClose={handleCloseDeleteFileModal}
        onDelete={handleDeleteFile}
      />
    </Stack>
  );
};

export default UppyUploadFile;
