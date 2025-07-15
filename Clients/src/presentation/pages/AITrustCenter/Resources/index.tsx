import React, { useState } from "react";
import { Alert, Snackbar, Box, Typography, IconButton,  Dialog, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, DialogTitle, DialogContent, Stack } from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import Toggle from '../../../components/Inputs/Toggle';
import { useStyles } from './styles';
import CustomizableButton from '../../../vw-v2-components/Buttons';
import IconButtonComponent from '../../../components/IconButton';
import Field from '../../../components/Inputs/Field';
import { useAITrustCentreOverview } from '../../../../application/hooks/useAITrustCentreOverview';
import { useAITrustCentreResources } from '../../../../application/hooks/useAITrustCentreResources';
import { TABLE_COLUMNS, WARNING_MESSAGES } from './constants';

// Import the type from the hook
type AITrustCentreOverviewData = Parameters<ReturnType<typeof useAITrustCentreOverview>['updateOverview']>[0];

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
  isFlashing: boolean;
}> = ({ resource, onDelete, onEdit, onMakeVisible, onDownload, isFlashing }) => {
  const styles = useStyles();
  
  return (
    <TableRow sx={styles.tableRow(isFlashing)}>
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
          type="Resource"
        />
      </TableCell>
    </TableRow>
  );
};

const TrustCenterResources: React.FC = () => {
  const { loading: overviewLoading, error: overviewError, updateOverview, fetchOverview } = useAITrustCentreOverview();
  const { resources, loading: resourcesLoading, error: resourcesError, createResource, deleteResource, updateResource } = useAITrustCentreResources();
  const styles = useStyles();
  
interface FormData {
  intro?: Record<string, unknown>;
  compliance_badges?: Record<string, unknown>;
  company_description?: Record<string, unknown>;
  terms_and_contact?: Record<string, unknown>;
  info?: {
    resources_visible?: boolean;
  };
}

// State management
const [formData, setFormData] = useState<FormData | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newResource, setNewResource] = useState<{ name: string; description: string; file: File | null }>({ name: '', description: '', file: null });
  const [editResource, setEditResource] = useState<{ id: number; name: string; description: string; visible: boolean; file: File | null; filename?: string }>({ id: 0, name: '', description: '', visible: true, file: null, filename: '' });
  const [flashingRowId, setFlashingRowId] = useState<number | null>(null);
  
  // Success/Error states
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [addResourceSuccess, setAddResourceSuccess] = useState(false);
  const [addResourceError, setAddResourceError] = useState<string | null>(null);
  const [deleteResourceSuccess, setDeleteResourceSuccess] = useState(false);
  const [deleteResourceError, setDeleteResourceError] = useState<string | null>(null);
  const [editResourceSuccess, setEditResourceSuccess] = useState(false);
  const [editResourceError, setEditResourceError] = useState<string | null>(null);

  // Load overview data on component mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchOverview();
        const overviewData = response?.data?.overview || response?.overview || response;
        setFormData(overviewData);
      } catch (error) {
        console.error('Error fetching overview data:', error);
      }
    };
    loadData();
  }, [fetchOverview]);

  // Handle field change and auto-save
  const handleFieldChange = (section: string, field: string, value: boolean | string) => {
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
          resources_visible: dataToUse.info?.resources_visible ?? false
        }
      } as Partial<AITrustCentreOverviewData>;
      
      await updateOverview(dataToSave);
      setSaveSuccess(true);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  // Modal handlers
  const handleOpenAddModal = () => {
    if (!formData?.info?.resources_visible) return;
    setAddModalOpen(true);
    setNewResource({ name: '', description: '', file: null });
    setAddResourceError(null);
  };
  
  const handleCloseAddModal = () => {
    setAddModalOpen(false);
    setNewResource({ name: '', description: '', file: null });
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
      filename: resource.filename || resource.name // Use filename if available, otherwise use resource name
    });
    setEditModalOpen(true);
    setEditResourceError(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditResource({ id: 0, name: '', description: '', visible: true, file: null });
    setEditResourceError(null);
  };
  
  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData?.info?.resources_visible) return;
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setAddResourceError('Please upload a PDF file');
        return;
      }
      setNewResource((prev) => ({ ...prev, file }));
      setAddResourceError(null);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData?.info?.resources_visible) return;
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setEditResourceError('Please upload a PDF file');
        return;
      }
      setEditResource((prev) => ({ ...prev, file }));
      setEditResourceError(null);
    }
  };
  
  // Resource operations
  const handleAddResource = async () => {
    if (!formData?.info?.resources_visible || !newResource.name || !newResource.description || !newResource.file) {
      setAddResourceError('Please fill in all fields and upload a file');
      return;
    }

    try {
      await createResource(newResource.file, newResource.name, newResource.description);
      setAddResourceSuccess(true);
      setAddModalOpen(false);
      setNewResource({ name: '', description: '', file: null });
      setAddResourceError(null);
    } catch (error: any) {
      setAddResourceError(error.message || 'Failed to create resource');
    }
  };

  const handleSaveEditResource = async () => {
    if (!formData?.info?.resources_visible || !editResource.name || !editResource.description) {
      setEditResourceError('Please fill in all required fields');
      return;
    }

    try {
      // Use the unified update function - it handles both cases
      await updateResource(editResource.id, editResource.name, editResource.description, editResource.visible, editResource.file || undefined);
      
      setEditResourceSuccess(true);
      setEditModalOpen(false);
      setEditResource({ id: 0, name: '', description: '', visible: true, file: null, filename: '' });
      setEditResourceError(null);
      
      setFlashingRowId(editResource.id);
      setTimeout(() => setFlashingRowId(null), 2000);
    } catch (error: any) {
      setEditResourceError(error.message || 'Failed to update resource');
    }
  };
  
  const handleEditResource = (resourceId: number) => {
    if (!formData?.info?.resources_visible) return;
    const resource = resources.find(r => r.id === resourceId);
    if (resource) {
      handleOpenEditModal(resource);
    }
  };
  
  const handleDeleteResource = async (resourceId: number) => {
    if (!formData?.info?.resources_visible) return;
    try {
      await deleteResource(resourceId);
      setDeleteResourceSuccess(true);
    } catch (error: any) {
      setDeleteResourceError(error.message || 'Failed to delete resource');
    }
  };
  
  const handleMakeVisible = async (resourceId: number) => {
    if (!formData?.info?.resources_visible) return;
    const resource = resources.find(r => r.id === resourceId);
    if (resource) {
      try {
        await updateResource(resourceId, resource.name, resource.description, !resource.visible);
        setFlashingRowId(resourceId);
        setTimeout(() => setFlashingRowId(null), 2000);
      } catch (error: any) {
        setEditResourceError(error.message || 'Failed to update resource visibility');
      }
    }
  };
  
  const handleDownload = (resourceId: number) => {
    if (!formData?.info?.resources_visible) return;
    console.log('download resource', resourceId);
  };

  // Show loading state
  if (overviewLoading || resourcesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (overviewError || resourcesError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">
          {overviewError || resourcesError}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography sx={styles.description}>
        Provide easy access to documentation and policies relevant to your AI governance, data security, compliance, and ethical practices. This section should act as a centralized repository where your customers, partners, and stakeholders can download, review, and understand key policy documents.
      </Typography>
      
      <Box sx={styles.container}>
        <Box sx={styles.resourcesHeader}>
          <Box sx={styles.toggleRow}>
            <Typography sx={styles.toggleLabel}>Enabled and visible</Typography>
            <Toggle 
              checked={formData?.info?.resources_visible ?? false} 
              onChange={(_, checked) => handleFieldChange('info', 'resources_visible', checked)} 
            />
          </Box>
        </Box>
        
        <Box sx={styles.tableWrapper}>
          <TableContainer 
            component={Paper} 
            sx={{
              ...styles.tableContainer,
              ...(formData?.info?.resources_visible ? {} : { opacity: 0.5, pointerEvents: 'none' })
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  {TABLE_COLUMNS.map((col) => (
                    <TableCell key={col.id} sx={styles.tableCell}>{col.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {resources.length > 0 ? (
                  resources.map((resource) => (
                    <ResourceTableRow
                      key={resource.id}
                      resource={resource}
                      onDelete={handleDeleteResource}
                      onEdit={handleEditResource}
                      onMakeVisible={handleMakeVisible}
                      onDownload={handleDownload}
                      isFlashing={flashingRowId === resource.id}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography sx={styles.emptyStateText}>
                        No resources found. Add your first resource to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {!formData?.info?.resources_visible && <Box sx={styles.overlay} />}
        </Box>
        
        <Stack>
          <CustomizableButton
            sx={styles.addButton}
            variant="contained"
            onClick={handleOpenAddModal}
            isDisabled={!formData?.info?.resources_visible}
            text="Add new resource"
            icon={<AddIcon />}
          />
        </Stack>

        {/* Add Resource Modal */}
        <Dialog 
          open={addModalOpen} 
          onClose={handleCloseAddModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: styles.modalPaper
          }}
        >
          <DialogTitle sx={styles.modalTitle}>
            Add a new resource
            <IconButton
              onClick={handleCloseAddModal}
              sx={styles.closeButton}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={styles.modalContent}>
            <Stack spacing={3}>
              <Field
                id="resource-name"
                label="Resource name"
                value={newResource.name}
                onChange={(e) => setNewResource(r => ({ ...r, name: e.target.value }))}
                disabled={!formData?.info?.resources_visible}
                isRequired
                sx={styles.fieldStyle}
                placeholder="Enter resource name"
              />
              <Field
                id="resource-description"
                label="Type or purpose of resource"
                value={newResource.description}
                onChange={(e) => setNewResource(r => ({ ...r, description: e.target.value }))}
                disabled={!formData?.info?.resources_visible}
                isRequired
                sx={styles.fieldStyle}
                placeholder="Enter resource description"
              />
              <Box>
                <CustomizableButton
                  text="Upload a file"
                  variant="outlined"
                  onClick={() => document.getElementById('resource-file-input')?.click()}
                  isDisabled={!formData?.info?.resources_visible}
                  sx={styles.fileUploadButton}
                />
                <input
                  id="resource-file-input"
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
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
                  isDisabled={!formData?.info?.resources_visible || !newResource.name || !newResource.description || !newResource.file}
                  sx={styles.modalActionButton}
                />
              </Box>
            </Stack>
          </DialogContent>
        </Dialog>

        {/* Edit Resource Modal */}
        <Dialog 
          open={editModalOpen} 
          onClose={handleCloseEditModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: styles.modalPaper
          }}
        >
          <DialogTitle sx={styles.modalTitle}>
            Edit resource
            <IconButton
              onClick={handleCloseEditModal}
              sx={styles.closeButton}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={styles.modalContent}>
            <Stack spacing={3}>
              <Field
                id="edit-resource-name"
                label="Resource name"
                value={editResource.name}
                onChange={(e) => setEditResource(r => ({ ...r, name: e.target.value }))}
                disabled={!formData?.info?.resources_visible}
                isRequired
                sx={styles.fieldStyle}
                placeholder="Enter resource name"
              />
              <Field
                id="edit-resource-description"
                label="Type or purpose of resource"
                value={editResource.description}
                onChange={(e) => setEditResource(r => ({ ...r, description: e.target.value }))}
                disabled={!formData?.info?.resources_visible}
                isRequired
                sx={styles.fieldStyle}
                placeholder="Enter resource description"
              />
              <Box>
                <Typography sx={styles.modalLabel}>Visibility</Typography>
                <Toggle 
                  checked={editResource.visible} 
                  onChange={(_, checked) => setEditResource(r => ({ ...r, visible: checked }))}
                />
              </Box>
              <Box>
                <CustomizableButton
                  text="Replace file"
                  variant="outlined"
                  onClick={() => document.getElementById('edit-resource-file-input')?.click()}
                  isDisabled={!formData?.info?.resources_visible}
                  sx={styles.fileUploadButton}
                />
                <input
                  id="edit-resource-file-input"
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
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
                  isDisabled={!formData?.info?.resources_visible || !editResource.name || !editResource.description}
                  sx={styles.modalActionButton}
                />
              </Box>
            </Stack>
          </DialogContent>
        </Dialog>
      </Box>

      {/* Success notification for overview save */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSaveSuccess(false)} 
          severity="success" 
          sx={styles.successAlert}
        >
          Resources saved successfully
        </Alert>
      </Snackbar>

      {/* Success notification for add resource */}
      <Snackbar
        open={addResourceSuccess}
        autoHideDuration={3000}
        onClose={() => setAddResourceSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setAddResourceSuccess(false)} 
          severity="success" 
          sx={styles.successAlert}
        >
          Resource added successfully
        </Alert>
      </Snackbar>

      {/* Error notification for add resource */}
      <Snackbar
        open={!!addResourceError}
        autoHideDuration={5000}
        onClose={() => setAddResourceError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setAddResourceError(null)} 
          severity="error" 
          sx={styles.errorAlert}
        >
          {addResourceError}
        </Alert>
      </Snackbar>

      {/* Success notification for delete resource */}
      <Snackbar
        open={deleteResourceSuccess}
        autoHideDuration={3000}
        onClose={() => setDeleteResourceSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setDeleteResourceSuccess(false)} 
          severity="success" 
          sx={styles.successAlert}
        >
          Resource deleted successfully
        </Alert>
      </Snackbar>

      {/* Error notification for delete resource */}
      <Snackbar
        open={!!deleteResourceError}
        autoHideDuration={5000}
        onClose={() => setDeleteResourceError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setDeleteResourceError(null)} 
          severity="error" 
          sx={styles.errorAlert}
        >
          {deleteResourceError}
        </Alert>
      </Snackbar>

      {/* Success notification for edit resource */}
      <Snackbar
        open={editResourceSuccess}
        autoHideDuration={3000}
        onClose={() => setEditResourceSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setEditResourceSuccess(false)} 
          severity="success" 
          sx={styles.successAlert}
        >
          Resource updated successfully
        </Alert>
      </Snackbar>

      {/* Error notification for edit resource */}
      <Snackbar
        open={!!editResourceError}
        autoHideDuration={5000}
        onClose={() => setEditResourceError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setEditResourceError(null)} 
          severity="error" 
          sx={styles.errorAlert}
        >
          {editResourceError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrustCenterResources; 