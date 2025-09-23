import React, { useState, Suspense } from "react";
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  TableCell,
  CircularProgress,
  DialogTitle,
  DialogContent,
  Stack,
} from "@mui/material";
import Alert from "../../../components/Alert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { ReactComponent as AddCircleOutlineIcon } from "../../../assets/icons/plus-circle-white.svg";
import { ReactComponent as CloseGreyIcon } from "../../../assets/icons/close-grey.svg";
import Toggle from "../../../components/Inputs/Toggle";
import { useStyles } from "./styles";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import IconButtonComponent from "../../../components/IconButton";
import Field from "../../../components/Inputs/Field";
import {
  useAITrustCentreOverviewQuery,
  useAITrustCentreOverviewMutation,
} from "../../../../application/hooks/useAITrustCentreOverviewQuery";
import {
  useAITrustCentreResourcesQuery,
  useCreateAITrustCentreResourceMutation,
  useUpdateAITrustCentreResourceMutation,
  useDeleteAITrustCentreResourceMutation,
} from "../../../../application/hooks/useAITrustCentreResourcesQuery";
import { handleDownload as downloadFile } from "../../../../application/tools/fileDownload";
import { handleAlert } from "../../../../application/tools/alertUtils";
import { TABLE_COLUMNS, WARNING_MESSAGES } from "./constants";
import { AITrustCentreOverviewData } from "../../../../application/hooks/useAITrustCentreOverview";
import { useTheme } from "@mui/material/styles";
import AITrustCenterTable from "../../../components/Table/AITrustCenterTable";
import { useModalKeyHandling } from "../../../../application/hooks/useModalKeyHandling";

interface Resource {
  id: number;
  name: string;
  description: string;
  visible: boolean;
}

// Helper component for Resource Table Row
const ResourceTableRow: React.FC<{
  resource: Resource;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  onMakeVisible: (id: number) => void;
  onDownload: (id: number) => void;
}> = ({
  resource,
  onDelete,
  onEdit,
  onMakeVisible,
  onDownload,
}) => {
  const theme = useTheme();
  const styles = useStyles(theme);

  return (
    <>
      <TableCell>
        <Typography sx={styles.resourceName}>{resource.name}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={styles.resourceType}>{resource.description}</Typography>
      </TableCell>
      <TableCell>
        {resource.visible ? (
          <VisibilityIcon sx={styles.visibilityIcon} />
        ) : (
          <VisibilityOffIcon sx={styles.visibilityOffIcon} />
        )}
      </TableCell>
      <TableCell>
        <IconButtonComponent
          id={resource.id}
          onDelete={() => onDelete(resource.id)}
          onEdit={() => onEdit(resource.id)}
          onMouseEvent={() => {}}
          onMakeVisible={() => onMakeVisible(resource.id)}
          onDownload={() => onDownload(resource.id)}
          isVisible={resource.visible}
          warningTitle={WARNING_MESSAGES.deleteTitle}
          warningMessage={WARNING_MESSAGES.deleteMessage}
          type="resource"
        />
      </TableCell>
    </>
  );
};

interface FormData {
  intro?: Record<string, unknown>;
  compliance_badges?: Record<string, unknown>;
  company_description?: Record<string, unknown>;
  terms_and_contact?: Record<string, unknown>;
  info?: {
    resources_visible?: boolean;
  };
}

const TrustCenterResources: React.FC = () => {
  const {
    data: overviewData,
    isLoading: overviewLoading,
    error: overviewError,
  } = useAITrustCentreOverviewQuery();
  const updateOverviewMutation = useAITrustCentreOverviewMutation();
  const {
    data: resources,
    isLoading: resourcesLoading,
    error: resourcesError,
  } = useAITrustCentreResourcesQuery();
  const createResourceMutation = useCreateAITrustCentreResourceMutation();
  const updateResourceMutation = useUpdateAITrustCentreResourceMutation();
  const deleteResourceMutation = useDeleteAITrustCentreResourceMutation();
  const theme = useTheme();
  const styles = useStyles(theme);

  // State management
  const [formData, setFormData] = useState<FormData | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newResource, setNewResource] = useState<{
    name: string;
    description: string;
    file: File | null;
  }>({ name: "", description: "", file: null });
  const [editResource, setEditResource] = useState<{
    id: number;
    name: string;
    description: string;
    visible: boolean;
    file: File | null;
    filename?: string;
    file_id?: number;
  }>({
    id: 0,
    name: "",
    description: "",
    visible: true,
    file: null,
    filename: "",
    file_id: undefined,
  });

  // Success/Error states
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const [addResourceError, setAddResourceError] = useState<string | null>(null);
  const [deleteResourceError, setDeleteResourceError] = useState<string | null>(
    null
  );
  const [editResourceError, setEditResourceError] = useState<string | null>(
    null
  );

  // Update local form data when query data changes
  React.useEffect(() => {
    if (overviewData) {
      setFormData(overviewData);
    }
  }, [overviewData]);

  // Handle field change and auto-save
  const handleFieldChange = (
    section: string,
    field: string,
    value: boolean | string
  ) => {
    setFormData((prev: FormData | null) => {
      if (!prev) return prev;
      const updatedData = {
        ...prev,
        [section]: {
          ...prev[section as keyof FormData],
          [field]: value,
        },
      };
      handleSave(updatedData);
      return updatedData;
    });
  };

  // Save data to server
  const handleSave = async (data?: FormData) => {
    try {
      const dataToUse = data || formData;
      if (!dataToUse) return;

      // Only send the info section with the resources_visible field
      const dataToSave = {
        info: {
          resources_visible: dataToUse.info?.resources_visible ?? false,
        },
      } as Partial<AITrustCentreOverviewData>;

      await updateOverviewMutation.mutateAsync(dataToSave);
      handleAlert({
        variant: "success",
        body: "Resources saved successfully",
        setAlert,
      });
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  // Modal handlers
  const handleOpenAddModal = () => {
    if (!formData?.info?.resources_visible) return;
    setAddModalOpen(true);
    setNewResource({ name: "", description: "", file: null });
    setAddResourceError(null);
  };

  const handleCloseAddModal = () => {
    setAddModalOpen(false);
    setNewResource({ name: "", description: "", file: null });
    setAddResourceError(null);
  };

  const handleOpenEditModal = (resource: any) => {
    if (!formData?.info?.resources_visible) return;
    setEditResource({
      id: resource.id,
      name: resource.name,
      description: resource.description,
      visible: resource.visible,
      file: null,
      filename: resource.filename || resource.name, // Use filename if available, otherwise use resource name
      file_id: resource.file_id, // Store the current file ID for deletion when replacing
    });
    setEditModalOpen(true);
    setEditResourceError(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditResource({
      id: 0,
      name: "",
      description: "",
      visible: true,
      file: null,
      filename: "",
      file_id: undefined,
    });
    setEditResourceError(null);
  };

  // Add modal key handling for ESC key support
  useModalKeyHandling({
    isOpen: addModalOpen,
    onClose: handleCloseAddModal,
  });

  useModalKeyHandling({
    isOpen: editModalOpen,
    onClose: handleCloseEditModal,
  });

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData?.info?.resources_visible) return;
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setAddResourceError("Please upload a PDF file");
        return;
      }
      setNewResource((prev) => ({ ...prev, file }));
      setAddResourceError(null);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData?.info?.resources_visible) return;
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setEditResourceError("Please upload a PDF file");
        return;
      }
      setEditResource((prev) => ({ ...prev, file }));
      setEditResourceError(null);
    }
  };

  // Resource operations
  const handleAddResource = async () => {
    if (
      !formData?.info?.resources_visible ||
      !newResource.name ||
      !newResource.description ||
      !newResource.file
    ) {
      setAddResourceError("Please fill in all fields and upload a file");
      return;
    }

    try {
      await createResourceMutation.mutateAsync({
        file: newResource.file,
        name: newResource.name,
        description: newResource.description,
        visible: true,
      });
      handleAlert({
        variant: "success",
        body: "Resource added successfully",
        setAlert,
      });
      setAddModalOpen(false);
      setNewResource({ name: "", description: "", file: null });
      setAddResourceError(null);
    } catch (error: any) {
      setAddResourceError(error.message || "Failed to create resource");
    }
  };

  const handleSaveEditResource = async () => {
    if (
      !formData?.info?.resources_visible ||
      !editResource.name ||
      !editResource.description
    ) {
      setEditResourceError("Please fill in all required fields");
      return;
    }

    try {
      // Pass the old file ID only when a new file is being uploaded
      const oldFileId = editResource.file ? editResource.file_id : undefined;

      // Use the unified update function - it handles both cases
      await updateResourceMutation.mutateAsync({
        resourceId: editResource.id,
        name: editResource.name,
        description: editResource.description,
        visible: editResource.visible,
        file: editResource.file || undefined,
        oldFileId: oldFileId,
      });

      handleAlert({
        variant: "success",
        body: "Resource updated successfully",
        setAlert,
      });
      setEditModalOpen(false);
      setEditResource({
        id: 0,
        name: "",
        description: "",
        visible: true,
        file: null,
        filename: "",
        file_id: undefined,
      });
      setEditResourceError(null);
    } catch (error: any) {
      setEditResourceError(error.message || "Failed to update resource");
    }
  };

  const handleEditResource = (resourceId: number) => {
    if (!formData?.info?.resources_visible || !resources) return;
    const resource = resources.find((r) => r.id === resourceId);
    if (resource) {
      handleOpenEditModal(resource);
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    if (!formData?.info?.resources_visible || !resources) return;
    try {
      await deleteResourceMutation.mutateAsync(resourceId);
      handleAlert({
        variant: "success",
        body: "Resource deleted successfully",
        setAlert,
      });
    } catch (error: any) {
      setDeleteResourceError(error.message || "Failed to delete resource");
    }
  };

  const handleMakeVisible = async (resourceId: number) => {
    if (!formData?.info?.resources_visible || !resources) return;
    const resource = resources.find((r) => r.id === resourceId);
    if (resource) {
      try {
        await updateResourceMutation.mutateAsync({
          resourceId: resourceId,
          name: resource.name,
          description: resource.description,
          visible: !resource.visible,
          file: undefined,
          oldFileId: undefined,
        });
      } catch (error: any) {
        setEditResourceError(
          error.message || "Failed to update resource visibility"
        );
      }
    }
  };

  const handleDownload = async (resourceId: number) => {
    if (!formData?.info?.resources_visible || !resources) return;

    try {
      // Find the resource to get its name for the download
      const resource = resources.find((r) => r.id === resourceId);
      if (!resource) {
        console.error("Resource not found");
        return;
      }

      // Use the existing handleDownload function from the codebase
      await downloadFile(resourceId.toString(), resource.name);
      handleAlert({
        variant: "success",
        body: "File downloaded successfully",
        setAlert,
      });
    } catch (error) {
      console.error("Download failed:", error);
      // You could add error handling here if needed
    }
  };

  // Show loading state
  if (overviewLoading || resourcesLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (overviewError || resourcesError) {
    const errorMessage =
      overviewError?.message || resourcesError?.message || "An error occurred";
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography color="error">{errorMessage}</Typography>
      </Box>
    );
  }

  // Ensure resources is available before rendering
  if (!resources) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography>No resources data available</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography sx={styles.description}>
        Provide easy access to documentation and policies relevant to your AI
        governance, data security, compliance, and ethical practices. This
        section should act as a centralized repository where your customers,
        partners, and stakeholders can download, review, and understand key
        policy documents.
      </Typography>

      <Box sx={styles.container}>
        <Box sx={styles.resourcesHeader}>
          <CustomizableButton
            sx={styles.addButton}
            variant="contained"
            onClick={handleOpenAddModal}
            isDisabled={!formData?.info?.resources_visible}
            text="Add new resource"
            icon={<AddCircleOutlineIcon />}
          />
          <Box sx={styles.toggleRow}>
            <Typography sx={styles.toggleLabel}>Enabled and visible</Typography>
            <Toggle
              checked={formData?.info?.resources_visible ?? false}
              onChange={(_, checked) =>
                handleFieldChange("info", "resources_visible", checked)
              }
            />
          </Box>
        </Box>

        <Box sx={styles.tableWrapper}>
          <AITrustCenterTable
            data={resources || []}
            columns={TABLE_COLUMNS}
            isLoading={resourcesLoading}
            paginated={false}
            disabled={!formData?.info?.resources_visible}
            emptyStateText="No resources found. Add your first resource to get started."
            renderRow={(resource) => (
              <ResourceTableRow
                key={resource.id}
                resource={resource}
                onDelete={handleDeleteResource}
                onEdit={handleEditResource}
                onMakeVisible={handleMakeVisible}
                onDownload={handleDownload}
              />
            )}
            tableId="resources-table"
          />
        </Box>

        {/* Add Resource Modal */}
        <Dialog
          open={addModalOpen}
          onClose={async (_event, reason) => {
            if (reason === "backdropClick") {
              return; // block closing on backdrop click
            }
            handleCloseAddModal();
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: styles.modalPaper,
          }}
        >
          <DialogTitle sx={styles.modalTitle}>
            Add a new resource
            <IconButton onClick={handleCloseAddModal} sx={styles.closeButton}>
              <CloseGreyIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={styles.modalContent}>
            <Stack spacing={3}>
              <Field
                id="resource-name"
                label="Resource name"
                value={newResource.name}
                onChange={(e) =>
                  setNewResource((r) => ({ ...r, name: e.target.value }))
                }
                disabled={!formData?.info?.resources_visible}
                isRequired
                sx={styles.fieldStyle}
                placeholder="Enter resource name"
              />
              <Field
                id="resource-description"
                label="Type or purpose of resource"
                value={newResource.description}
                onChange={(e) =>
                  setNewResource((r) => ({ ...r, description: e.target.value }))
                }
                disabled={!formData?.info?.resources_visible}
                isRequired
                sx={styles.fieldStyle}
                placeholder="Enter resource description"
              />
              <Box>
                <CustomizableButton
                  text="Upload a file"
                  variant="outlined"
                  onClick={() =>
                    document.getElementById("resource-file-input")?.click()
                  }
                  isDisabled={!formData?.info?.resources_visible}
                  sx={styles.fileUploadButton}
                />
                <input
                  id="resource-file-input"
                  type="file"
                  accept="application/pdf"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                  disabled={!formData?.info?.resources_visible}
                />
                {newResource.file && (
                  <Typography sx={styles.fileName}>
                    {newResource.file.name}
                  </Typography>
                )}
              </Box>
              <Box display="flex" justifyContent="flex-end">
                <CustomizableButton
                  text="Add resource"
                  variant="contained"
                  onClick={handleAddResource}
                  isDisabled={
                    !formData?.info?.resources_visible ||
                    !newResource.name ||
                    !newResource.description ||
                    !newResource.file
                  }
                  sx={styles.modalActionButton}
                />
              </Box>
            </Stack>
          </DialogContent>
        </Dialog>

        {/* Edit Resource Modal */}
        <Dialog
          open={editModalOpen}
          onClose={(_event, reason) => {
            if (reason === "backdropClick") {
              return; // block closing on backdrop click
            }
            handleCloseEditModal();
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: styles.modalPaper,
          }}
        >
          <DialogTitle sx={styles.modalTitle}>
            Edit resource
            <IconButton onClick={handleCloseEditModal} sx={styles.closeButton}>
              <CloseGreyIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={styles.modalContent}>
            <Stack spacing={3}>
              <Field
                id="edit-resource-name"
                label="Resource name"
                value={editResource.name}
                onChange={(e) =>
                  setEditResource((r) => ({ ...r, name: e.target.value }))
                }
                disabled={!formData?.info?.resources_visible}
                isRequired
                sx={styles.fieldStyle}
                placeholder="Enter resource name"
              />
              <Field
                id="edit-resource-description"
                label="Type or purpose of resource"
                value={editResource.description}
                onChange={(e) =>
                  setEditResource((r) => ({
                    ...r,
                    description: e.target.value,
                  }))
                }
                disabled={!formData?.info?.resources_visible}
                isRequired
                sx={styles.fieldStyle}
                placeholder="Enter resource description"
              />
              <Box>
                <Typography sx={styles.modalLabel}>Visibility</Typography>
                <Toggle
                  checked={editResource.visible}
                  onChange={(_, checked) =>
                    setEditResource((r) => ({ ...r, visible: checked }))
                  }
                />
              </Box>
              <Box>
                <CustomizableButton
                  text="Replace file"
                  variant="outlined"
                  onClick={() =>
                    document.getElementById("edit-resource-file-input")?.click()
                  }
                  isDisabled={!formData?.info?.resources_visible}
                  sx={styles.fileUploadButton}
                />
                <input
                  id="edit-resource-file-input"
                  type="file"
                  accept="application/pdf"
                  style={{ display: "none" }}
                  onChange={handleEditFileChange}
                  disabled={!formData?.info?.resources_visible}
                />
                {/* Show existing file name */}
                {!editResource.file && editResource.filename && (
                  <Typography sx={styles.existingFileName}>
                    Current file: {editResource.filename}
                  </Typography>
                )}
                {/* Show new file name when selected */}
                {editResource.file && (
                  <Typography sx={styles.fileName}>
                    New file: {editResource.file.name}
                  </Typography>
                )}
              </Box>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <CustomizableButton
                  variant="outlined"
                  text="Cancel"
                  onClick={handleCloseEditModal}
                  sx={styles.modalCancelButton}
                />
                <CustomizableButton
                  text="Save"
                  variant="contained"
                  onClick={handleSaveEditResource}
                  isDisabled={
                    !formData?.info?.resources_visible ||
                    !editResource.name ||
                    !editResource.description
                  }
                  sx={styles.modalActionButton}
                />
              </Box>
            </Stack>
          </DialogContent>
        </Dialog>
      </Box>

      {alert && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant={alert.variant}
            title={alert.title}
            body={alert.body}
            isToast={true}
            onClick={() => setAlert(null)}
          />
        </Suspense>
      )}

      {/* Error notification for add resource */}
      {addResourceError && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant="error"
            body={addResourceError}
            isToast={true}
            onClick={() => setAddResourceError(null)}
          />
        </Suspense>
      )}

      {/* Error notification for delete resource */}
      {deleteResourceError && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant="error"
            body={deleteResourceError}
            isToast={true}
            onClick={() => setDeleteResourceError(null)}
          />
        </Suspense>
      )}

      {/* Error notification for edit resource */}
      {editResourceError && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant="error"
            body={editResourceError}
            isToast={true}
            onClick={() => setEditResourceError(null)}
          />
        </Suspense>
      )}
    </Box>
  );
};

export default TrustCenterResources;
