import { Stack, useTheme, IconButton, Typography, Link } from "@mui/material";
import Uppy from "@uppy/core";
import { useState } from "react";
import { X as CloseGreyIcon, Trash2 as DeleteIconGrey } from "lucide-react";
import DeleteFileModal from "./DeleteFileModal";
import getStyles from "./getStyles";
import { FileData } from "../../../../domain/types/File";
import UppyDashboard from "../../../components/UppyDashboard";
import Button from "../../../components/Button";
import { handleDownload } from "../../../../application/tools/fileDownload";

interface UppyUploadFileProps {
  uppy: Uppy;
  files: FileData[];
  onClose: () => void;
  onRemoveFile: (fileId: string) => void;
  hideProgressIndicators?: boolean;
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
      component="button"
      onClick={() => handleDownload(file.id, file.fileName)}
      sx={styles.fileLink}
    >
      <Typography component="span" variant="body2" sx={styles.fileName}>
        {file.fileName}
      </Typography>
    </Link>
    <IconButton onClick={() => onDeleteClick(file.id, file.fileName)}>
      <DeleteIconGrey size={16} />
    </IconButton>
  </Stack>
);

const UppyUploadFile: React.FC<UppyUploadFileProps> = ({
  uppy,
  files,
  onClose,
  onRemoveFile,
  hideProgressIndicators,
}) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [deleteFileModal, setDeleteFileModal] = useState({
    isOpen: false,
    fileId: "",
    fileName: "",
  });

  // Separate files into pending uploads and attached files
  const pendingUploads = files.filter((file) => file.data instanceof Blob);
  const attachedFiles = files.filter((file) => !(file.data instanceof Blob));

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
          <CloseGreyIcon size={16} />
        </IconButton>
      </Stack>

      <UppyDashboard
        uppy={uppy}
        width={400}
        height={250}
        hideProgressIndicators={hideProgressIndicators ?? false}
        files={pendingUploads}
      />

      {attachedFiles.length > 0 && (
        <>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 500,
              color: "#344054",
              mt: 2,
              mb: 1,
              borderTop: "1px solid #E5E7EB",
              pt: 2,
              width: "100%",
            }}
          >
            Attached Files
          </Typography>
          <Stack sx={styles.fileList}>
            {attachedFiles.map((file) => (
              <FileListItem
                key={file.id}
                file={file}
                onDeleteClick={handleOpenDeleteFileModal}
                styles={styles}
              />
            ))}
          </Stack>
        </>
      )}

      <DeleteFileModal
        isOpen={deleteFileModal.isOpen}
        fileName={deleteFileModal.fileName}
        onClose={handleCloseDeleteFileModal}
        onDelete={handleDeleteFile}
      />
      <Button variant="contained" disableRipple onClick={onClose}>
        I am done
      </Button>
    </Stack>
  );
};

export default UppyUploadFile;
