import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Stack,
  IconButton,
  Button,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { Project } from "../../../../domain/types/Project";
import { Framework } from "../../../../domain/types/Framework";
import {
  modalContainerStyle,
  modalHeaderStyle,
  modalCloseButtonStyle,
  modalDescriptionStyle,
  frameworkCardStyle,
  frameworkCardTitleStyle,
  frameworkCardDescriptionStyle,
  modalDoneButtonStyle,
} from "./styles";
import {
  assignFrameworkToProject,
  deleteEntityById,
} from "../../../../application/repository/entity.repository";
import { logEngine } from "../../../../application/tools/log.engine";
import Alert from "../../../components/Alert";
import CustomizableToast from "../../../vw-v2-components/Toast";
import DualButtonModal from "../../../vw-v2-components/Dialogs/DualButtonModal";

interface AddFrameworkModalProps {
  open: boolean;
  onClose: () => void;
  frameworks: Framework[];
  project: Project;
  onFrameworksChanged?: (action: "add" | "remove") => void;
}

const AddFrameworkModal: React.FC<AddFrameworkModalProps> = ({
  open,
  onClose,
  frameworks,
  project,
  onFrameworksChanged,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
    isToast: boolean;
    visible: boolean;
  } | null>(null);
  const [frameworkToRemove, setFrameworkToRemove] = useState<Framework | null>(
    null
  );
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  const handleAddFramework = async (fw: Framework) => {
    setIsLoading(true);
    try {
      const response = await assignFrameworkToProject({
        frameworkId: Number(fw.id),
        projectId: String(project.id),
      });
      if (response.status === 200 || response.status === 201) {
        setAlert({
          variant: "success",
          body: "Framework added successfully",
          isToast: true,
          visible: true,
        });
        if (onFrameworksChanged) onFrameworksChanged("add");
      } else {
        setAlert({
          variant: "error",
          body: "Failed to add framework. Please try again.",
          isToast: true,
          visible: true,
        });
      }
    } catch (error) {
      logEngine({
        type: "error",
        message: "An error occurred while adding the framework.",
      });
      setAlert({
        variant: "error",
        body: "An unexpected error occurred. Please try again.",
        isToast: true,
        visible: true,
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleRemoveFramework = async () => {
    if (!frameworkToRemove) return;
    setIsLoading(true);
    try {
      const response = await deleteEntityById({
        routeUrl: `/frameworks/fromProject?frameworkId=${frameworkToRemove.id}&projectId=${project.id}`,
      });
      if (response.status === 200) {
        setAlert({
          variant: "success",
          body: "Framework removed successfully",
          isToast: true,
          visible: true,
        });
        if (onFrameworksChanged) onFrameworksChanged("remove");
      } else {
        setAlert({
          variant: "error",
          body: "Failed to remove framework. Please try again.",
          isToast: true,
          visible: true,
        });
      }
    } catch (error) {
      logEngine({
        type: "error",
        message: "An error occurred while removing the framework.",
      });
      setAlert({
        variant: "error",
        body: "An unexpected error occurred. Please try again.",
        isToast: true,
        visible: true,
      });
    } finally {
      setIsLoading(false);
      setIsRemoveModalOpen(false);
      setFrameworkToRemove(null);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const isFrameworkAdded = (fw: Framework) =>
    project.framework?.some((pf) => Number(pf.framework_id) === Number(fw.id));

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalContainerStyle}>
        {/* Header */}
        <Box sx={modalHeaderStyle}>
          <Typography sx={{ fontSize: 20, fontWeight: 600, color: "#232B3A" }}>
            AI Frameworks
          </Typography>
          <IconButton
            aria-label="Close modal"
            onClick={onClose}
            sx={modalCloseButtonStyle}
          >
            <CloseIcon fontSize="medium" />
          </IconButton>
        </Box>
        {/* Description */}
        <Box sx={{ p: 2, pt: 0 }}>
          <Typography sx={modalDescriptionStyle}>
            Add or remove AI frameworks to your platform. Selected frameworks
            will be integrated into your compliance workflow.
          </Typography>
          <Stack spacing={6}>
            {frameworks.map((fw) => {
              const isAdded = isFrameworkAdded(fw);
              const onlyOneFramework =
                project.framework?.length === 1 && isAdded;
              return (
                <Box key={fw.id} sx={frameworkCardStyle}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    mb={1}
                  >
                    <Typography sx={frameworkCardTitleStyle}>
                      {fw.name}
                    </Typography>
                    {isAdded && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          background: "#E6F4EE",
                          borderRadius: "12px",
                          px: 1.5,
                          py: 0.5,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#13715B",
                        }}
                      >
                        <CheckIcon sx={{ color: "#13715B", fontSize: 18 }} />
                        Added
                      </Box>
                    )}
                  </Box>
                  <Typography sx={frameworkCardDescriptionStyle}>
                    {fw.description}
                  </Typography>
                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    {isAdded ? (
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        disabled={isLoading || onlyOneFramework}
                        onClick={() => {
                          setFrameworkToRemove(fw);
                          setIsRemoveModalOpen(true);
                        }}
                        sx={{ minWidth: 100, fontWeight: 600 }}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        sx={{
                          minWidth: 100,
                          fontWeight: 600,
                          backgroundColor: "#13715B",
                          color: "#fff",
                          "&:hover": { backgroundColor: "#0e5c47" },
                        }}
                        size="small"
                        disabled={isLoading}
                        onClick={() => handleAddFramework(fw)}
                      >
                        Add
                      </Button>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Box>
        {/* Done Button */}
        <Box
          sx={{
            p: 2,
            pt: 0,
            display: "flex",
            justifyContent: "flex-end",
            paddingTop: "20px",
          }}
        >
          <Button
            onClick={onClose}
            color="primary"
            variant="contained"
            sx={modalDoneButtonStyle}
          >
            Done
          </Button>
        </Box>
        {alert && alert.visible && (
          <Alert
            variant={alert.variant}
            title={alert.title}
            body={alert.body}
            isToast={true}
            onClick={() => setAlert(null)}
          />
        )}
        {isLoading && <CustomizableToast title="Processing..." />}
        {isRemoveModalOpen && frameworkToRemove && (
          <DualButtonModal
            title="Confirm Framework Removal"
            body={
              <Typography fontSize={13}>
                Are you sure you want to remove {frameworkToRemove.name} from
                the project?
              </Typography>
            }
            cancelText="Cancel"
            proceedText="Remove"
            onCancel={() => {
              setIsRemoveModalOpen(false);
              setFrameworkToRemove(null);
            }}
            onProceed={handleRemoveFramework}
            proceedButtonColor="error"
            proceedButtonVariant="contained"
            TitleFontSize={0}
          />
        )}
      </Box>
    </Modal>
  );
};

export default AddFrameworkModal;
