import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  Stack,
} from "@mui/material";
import { Trash2 as DeleteIconRed, Pencil as EditIconGrey, Check as CheckGreenIcon } from "lucide-react";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import { Project } from "../../../../domain/types/Project";
import { Framework } from "../../../../domain/types/Framework";
import ProjectForm from "../../../components/Forms/ProjectForm";
import DualButtonModal from "../../../components/Dialogs/DualButtonModal";
import StandardModal from "../../../components/Modals/StandardModal";
import { deleteProject } from "../../../../application/repository/project.repository";
import { FrameworkTypeEnum } from "../../../components/Forms/ProjectForm/constants";
import allowedRoles from "../../../../application/constants/permissions";
import { useAuth } from "../../../../application/hooks/useAuth";
import {
  assignFrameworkToProject,
  deleteEntityById,
} from "../../../../application/repository/entity.repository";
import Alert from "../../../components/Alert";
import CustomizableToast from "../../../components/Toast";

interface FrameworkSettingsProps {
  organizationalProject: Project;
  allFrameworks: Framework[];
  filteredFrameworks: Framework[];
  onProjectDataChanged: () => Promise<void>;
  onFrameworksChanged: () => void;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const FrameworkSettings: React.FC<FrameworkSettingsProps> = ({
  organizationalProject,
  allFrameworks,
  filteredFrameworks: _filteredFrameworks,
  onProjectDataChanged,
  onFrameworksChanged,
  setProjects,
}) => {
  const { userRoleName } = useAuth();
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const submitFormRef = useRef<(() => void) | undefined>();
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
    isToast: boolean;
    visible: boolean;
  } | null>(null);
  const [frameworkToRemove, setFrameworkToRemove] = useState<Framework | null>(null);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  // Get available frameworks for organizational projects (ISO 27001, ISO 42001, and NIST AI RMF)
  const availableFrameworks = allFrameworks.filter((framework) => {
    const isNotEuAiAct = !framework.name.toLowerCase().includes("eu ai act");
    const isComplianceFramework =
      framework.name.toLowerCase().includes("iso 27001") ||
      framework.name.toLowerCase().includes("iso 42001") ||
      framework.name.toLowerCase().includes("nist ai rmf");
    return isNotEuAiAct && isComplianceFramework;
  });

  const isFrameworkAdded = (fw: Framework) =>
    organizationalProject.framework?.some((pf) => Number(pf.framework_id) === Number(fw.id));

  const handleEditProjectClick = () => {
    setIsEditProjectModalOpen(true);
  };

  const handleDeleteProjectClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProject = async () => {
    try {
      const response = await deleteProject({
        id: organizationalProject.id,
      });

      if (response.status >= 200 && response.status < 300) {
        // Remove the project from context
        setProjects((prevProjects) =>
          prevProjects.filter(
            (project) => project.id !== organizationalProject.id
          )
        );
        setAlert({
          variant: "success",
          body: "Framework deleted successfully",
          isToast: true,
          visible: true,
        });
      } else {
        setAlert({
          variant: "error",
          body: "Failed to delete framework",
          isToast: true,
          visible: true,
        });
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      setAlert({
        variant: "error",
        body: "An unexpected error occurred while deleting the project",
        isToast: true,
        visible: true,
      });
    } finally {
      setIsDeleteModalOpen(false);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleAddFramework = async (fw: Framework) => {
    setIsLoading(true);
    try {
      const response = await assignFrameworkToProject({
        frameworkId: Number(fw.id),
        projectId: String(organizationalProject.id),
      });
      if (response.status === 200 || response.status === 201) {
        setAlert({
          variant: "success",
          body: "Framework added successfully",
          isToast: true,
          visible: true,
        });
        await onProjectDataChanged();
        onFrameworksChanged();
      } else {
        setAlert({
          variant: "error",
          body: "Failed to add framework. Please try again.",
          isToast: true,
          visible: true,
        });
      }
    } catch (error) {
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
        routeUrl: `/frameworks/fromProject?frameworkId=${frameworkToRemove.id}&projectId=${organizationalProject.id}`,
      });
      if (response.status === 200) {
        setAlert({
          variant: "success",
          body: "Framework removed successfully",
          isToast: true,
          visible: true,
        });
        await onProjectDataChanged();
        onFrameworksChanged();
      } else {
        setAlert({
          variant: "error",
          body: "Failed to remove framework. Please try again.",
          isToast: true,
          visible: true,
        });
      }
    } catch (error) {
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

  return (
    <Stack spacing={4}>
      {/* Framework Settings Section */}
      <Box>
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 600,
            mb: 3,
            color: "#000000",
          }}
        >
          Framework settings
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 3,
            alignItems: "stretch",
          }}
        >
          <Box
            sx={{
              background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              border: "1px solid #d0d5dd",
              borderRadius: "4px",
              p: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 1, color: "#000000" }}>
              {organizationalProject.project_title}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#666666" }}>
              Organizational framework
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <CustomizableButton
              variant="outlined"
              icon={<EditIconGrey size={16} />}
              text="Edit framework"
              onClick={handleEditProjectClick}
              isDisabled={!allowedRoles.projects.edit.includes(userRoleName)}
              sx={{
                borderColor: "#D1D5DB",
                width: "170px",
                color: "#374151",
                "&:hover": {
                  borderColor: "#9CA3AF",
                  backgroundColor: "#F9FAFB",
                },
              }}
            />

            <CustomizableButton
              variant="outlined"
              icon={<DeleteIconRed size={16} />}
              text="Delete framework"
              onClick={handleDeleteProjectClick}
              isDisabled={!allowedRoles.projects.delete.includes(userRoleName)}
              sx={{
                borderColor: "#F87171",
                width: "170px",
                color: "#DC2626",
                "&:hover": {
                  borderColor: "#EF4444",
                  backgroundColor: "#FEF2F2",
                },
              }}
            />
          </Stack>
        </Box>
        </Box>
      </Box>

      {/* Framework Management Section */}
      <Box>
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 600,
            mb: 3,
            color: "#000000",
          }}
        >
          Framework management
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 3,
            alignItems: "stretch",
          }}
        >
          {availableFrameworks.map((fw) => {
            const isAdded = isFrameworkAdded(fw);
            const onlyOneFramework = organizationalProject.framework?.length === 1 && isAdded;

            return (
              <Box
                key={fw.id}
                sx={{
                  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                  border: "1px solid #d0d5dd",
                  borderRadius: "4px",
                  p: "24px",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "150px",
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#000000" }}>
                    {fw.name}
                  </Typography>
                  {isAdded && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        backgroundColor: "#E6F4EE",
                        borderRadius: "4px",
                        px: 1.5,
                        py: 0.5,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#13715B",
                      }}
                    >
                      <CheckGreenIcon size={16} />
                      Added
                    </Box>
                  )}
                </Box>

                <Typography sx={{ fontSize: 13, color: "#666666", mb: "auto" }}>
                  {fw.description}
                </Typography>

                <Box display="flex" justifyContent="flex-end" mt={2}>
                  {isAdded ? (
                    <CustomizableButton
                      variant="outlined"
                      text="Remove"
                      isDisabled={
                        isLoading ||
                        onlyOneFramework ||
                        !allowedRoles.frameworks.manage.includes(userRoleName)
                      }
                      onClick={() => {
                        setFrameworkToRemove(fw);
                        setIsRemoveModalOpen(true);
                      }}
                      sx={{
                        minWidth: 100,
                        borderColor: "#F87171",
                        color: "#DC2626",
                        "&:hover": {
                          borderColor: "#EF4444",
                          backgroundColor: "#FEF2F2",
                        },
                      }}
                    />
                  ) : (
                    <CustomizableButton
                      variant="contained"
                      text="Add"
                      isDisabled={
                        isLoading ||
                        !allowedRoles.frameworks.manage.includes(userRoleName)
                      }
                      onClick={() => handleAddFramework(fw)}
                      sx={{
                        minWidth: 100,
                        backgroundColor: "#13715B",
                        color: "#fff",
                        "&:hover": { backgroundColor: "#0e5c47" },
                      }}
                    />
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Modals */}
      {isEditProjectModalOpen && (
        <StandardModal
          isOpen={isEditProjectModalOpen}
          onClose={async () => {
            setIsEditProjectModalOpen(false);
            await onProjectDataChanged();
          }}
          title="Edit framework"
          description="Update your framework details below"
          onSubmit={() => {
            if (submitFormRef.current) {
              submitFormRef.current();
            }
          }}
          submitButtonText="Update framework"
          maxWidth="900px"
        >
          <ProjectForm
            projectToEdit={organizationalProject}
            defaultFrameworkType={FrameworkTypeEnum.OrganizationWide}
            useStandardModal={true}
            onSubmitRef={submitFormRef}
            onClose={async () => {
              setIsEditProjectModalOpen(false);
              await onProjectDataChanged();
            }}
          />
        </StandardModal>
      )}

      {isDeleteModalOpen && (
        <DualButtonModal
          title="Confirm delete"
          body={
            <Typography fontSize={13}>
              Are you sure you want to delete the framework "
              {organizationalProject.project_title}"? This action cannot be
              undone and will remove all associated data.
            </Typography>
          }
          cancelText="Cancel"
          proceedText="Delete"
          onCancel={() => setIsDeleteModalOpen(false)}
          onProceed={handleDeleteProject}
          proceedButtonColor="error"
          proceedButtonVariant="contained"
          TitleFontSize={0}
        />
      )}

      {isRemoveModalOpen && frameworkToRemove && (
        <DualButtonModal
          title="Confirm framework removal"
          body={
            <Typography fontSize={13}>
              Are you sure you want to remove {frameworkToRemove.name} from
              the framework?
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
    </Stack>
  );
};

export default FrameworkSettings;