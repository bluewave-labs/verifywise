import React, { useState, Suspense } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Stack, CircularProgress } from "@mui/material";
import Toggle from '../../../components/Inputs/Toggle';
import IconButtonComponent from '../../../components/IconButton';
import { useStyles } from './styles';
import Field from '../../../components/Inputs/Field';
import CustomizableButton from '../../../vw-v2-components/Buttons';
import { Modal, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { useTheme } from '@mui/material/styles';
import Alert from '../../../components/Alert';
import { useAITrustCentreOverview } from '../../../../application/hooks/useAITrustCentreOverview';
import { useAITrustCentreSubprocessors } from '../../../../application/hooks/useAITrustCentreSubprocessors';
import { handleAlert } from '../../../../application/tools/alertUtils';
import { AITrustCentreOverviewData } from '../../../../application/hooks/useAITrustCentreOverview';

import {
  TABLE_COLUMNS,
  WARNING_MESSAGES
} from './constants';

interface Subprocessor {
  id: number;
  name: string;
  purpose: string;
  location: string;
  url: string;
}

interface FormData {
  info?: {
    subprocessor_visible?: boolean;
  };
}

// Helper component for Subprocessor Table Row
const SubprocessorTableRow: React.FC<{
  subprocessor: Subprocessor;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  isFlashing: boolean;
}> = ({ subprocessor, onDelete, onEdit, isFlashing }) => {
  const theme = useTheme();
  const styles = useStyles(theme);
  
  return (
    <TableRow sx={styles.tableRow(isFlashing)}>
      <TableCell>
        <Typography sx={styles.tableDataCell}>{subprocessor.name}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={styles.tableDataCell}>{subprocessor.url}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={styles.tableDataCell}>{subprocessor.purpose}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={styles.tableDataCell}>{subprocessor.location}</Typography>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButtonComponent
            id={subprocessor.id}
            onDelete={() => onDelete(subprocessor.id)}
            onEdit={() => onEdit(subprocessor.id)}
            onMouseEvent={() => {}}
            type=""
            warningTitle={WARNING_MESSAGES.deleteTitle}
            warningMessage={WARNING_MESSAGES.deleteMessage}
          />
        </Box>
      </TableCell>
    </TableRow>
  );
};

// Helper component for Modal Field
const ModalField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  enabled: boolean;
}> = ({ label, value, onChange, enabled }) => (
  <Field
    label={label}
    value={value}
    onChange={e => enabled && onChange(e.target.value)}
    sx={{ width: '100%' }}
    disabled={!enabled}
  />
);

const AITrustCenterSubprocessors: React.FC = () => {
  const { loading: overviewLoading, error: overviewError, updateOverview, fetchOverview } = useAITrustCentreOverview();
  const { subprocessors, loading: subprocessorsLoading, error: subprocessorsError, createSubprocessor, deleteSubprocessor, updateSubprocessor } = useAITrustCentreSubprocessors();
  const theme = useTheme();
  const styles = useStyles(theme);

  // State management
  const [formData, setFormData] = useState<FormData | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', purpose: '', url: '', location: '' });
  const [newSubprocessor, setNewSubprocessor] = useState({ name: '', purpose: '', url: '', location: '' });
  const [flashingRowId, setFlashingRowId] = useState<number | null>(null);
  
  // Success/Error states
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const [addSubprocessorError, setAddSubprocessorError] = useState<string | null>(null);
  const [deleteSubprocessorError, setDeleteSubprocessorError] = useState<string | null>(null);
  const [editSubprocessorError, setEditSubprocessorError] = useState<string | null>(null);

  // Load overview data on component mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchOverview();
        const overviewData = response?.data?.overview || response?.overview || response;
        setFormData(overviewData);
      } catch (error) {
        console.error('Error fetching overview data:', error);
        handleAlert({
          variant: "error",
          body: "Failed to load overview data. Please refresh the page.",
          setAlert,
        });
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
      
      // Only send the info section with the subprocessor_visible field
      const dataToSave = {
        info: {
          subprocessor_visible: dataToUse.info?.subprocessor_visible ?? false
        }
      } as Partial<AITrustCentreOverviewData>;
      
      await updateOverview(dataToSave);
      handleAlert({
        variant: "success",
        body: "Subprocessors saved successfully",
        setAlert,
      });
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  // Modal handlers
  const handleOpenAddModal = () => {
    if (!formData?.info?.subprocessor_visible) return;
    setAddModalOpen(true);
    setNewSubprocessor({ name: '', purpose: '', url: '', location: '' });
    setAddSubprocessorError(null);
  };

  const handleCloseAddModal = () => {
    setAddModalOpen(false);
    setNewSubprocessor({ name: '', purpose: '', url: '', location: '' });
    setAddSubprocessorError(null);
  };

  const handleOpenEditModal = (subprocessor: Subprocessor) => {
    if (!formData?.info?.subprocessor_visible) return;
    setForm({ name: subprocessor.name, purpose: subprocessor.purpose, url: subprocessor.url, location: subprocessor.location });
    setEditId(subprocessor.id);
    setEditModalOpen(true);
    setEditSubprocessorError(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditId(null);
    setForm({ name: '', purpose: '', url: '', location: '' });
    setEditSubprocessorError(null);
  };

  const handleFormChange = (field: string, value: string) => {
    if (!formData?.info?.subprocessor_visible) return;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewSubprocessorChange = (field: string, value: string) => {
    if (!formData?.info?.subprocessor_visible) return;
    setNewSubprocessor((prev) => ({ ...prev, [field]: value }));
  };

  // Subprocessor operations
  const handleAddSubprocessor = async () => {
    if (!formData?.info?.subprocessor_visible || !newSubprocessor.name || !newSubprocessor.purpose || !newSubprocessor.url || !newSubprocessor.location) {
      setAddSubprocessorError('Please fill in all fields');
      return;
    }

    try {
      await createSubprocessor(newSubprocessor.name, newSubprocessor.purpose, newSubprocessor.location, newSubprocessor.url);
      handleAlert({
        variant: "success",
        body: "Subprocessor added successfully",
        setAlert,
      });
      setAddModalOpen(false);
      setNewSubprocessor({ name: '', purpose: '', url: '', location: '' });
      setAddSubprocessorError(null);
    } catch (error: any) {
      setAddSubprocessorError(error.message || 'Failed to create subprocessor');
    }
  };

  const handleEditSave = async () => {
    if (!formData?.info?.subprocessor_visible || !editId || !form.name || !form.purpose || !form.url || !form.location) {
      setEditSubprocessorError('Please fill in all fields');
      return;
    }

    try {
      await updateSubprocessor(editId, form.name, form.purpose, form.location, form.url);
      handleAlert({
        variant: "success",
        body: "Subprocessor updated successfully",
        setAlert,
      });
      setEditModalOpen(false);
      setEditId(null);
      setForm({ name: '', purpose: '', url: '', location: '' });
      setEditSubprocessorError(null);
      
      setFlashingRowId(editId);
      setTimeout(() => setFlashingRowId(null), 2000);
    } catch (error: any) {
      setEditSubprocessorError(error.message || 'Failed to update subprocessor');
    }
  };

  const handleEdit = (subprocessorId: number) => {
    if (!formData?.info?.subprocessor_visible) return;
    const subprocessor = subprocessors.find(sp => sp.id === subprocessorId);
    if (subprocessor) {
      handleOpenEditModal(subprocessor);
    }
  };

  const handleDelete = async (subprocessorId: number) => {
    if (!formData?.info?.subprocessor_visible) return;
    try {
      await deleteSubprocessor(subprocessorId);
      handleAlert({
        variant: "success",
        body: "Subprocessor deleted successfully",
        setAlert,
      });
    } catch (error: any) {
      setDeleteSubprocessorError(error.message || 'Failed to delete subprocessor');
    }
  };

  // Show loading state
  if (overviewLoading || subprocessorsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (overviewError || subprocessorsError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">
          {overviewError || subprocessorsError}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography sx={styles.description}>
        The subprocessor section is an important part of your AI Trust Center. It provides transparency about third-party vendors that process or store data on behalf of your organization. Subprocessors are integral to various operations, from AI model hosting and data storage to compliance monitoring and analytics.
      </Typography>
      <Box sx={styles.container}>
        <Box sx={styles.subprocessorsHeader}>
          <Box sx={styles.headerControls}>
            <CustomizableButton
              sx={styles.addButton}
              variant="contained"
              onClick={handleOpenAddModal}
              isDisabled={!formData?.info?.subprocessor_visible}
              text="Add new subprocessor"
              icon={<AddIcon />}
            />
            <Box sx={styles.toggleRow}>
              <Typography sx={styles.toggleLabel}>Enabled and visible</Typography>
              <Toggle 
                checked={formData?.info?.subprocessor_visible ?? false} 
                onChange={(_, checked) => handleFieldChange('info', 'subprocessor_visible', checked)} 
              />
            </Box>
          </Box>
        </Box>
        <Box sx={styles.tableWrapper}>
          <TableContainer component={Paper} sx={{ 
            ...styles.tableContainer,
            ...(formData?.info?.subprocessor_visible ? {} : { opacity: 0.9, pointerEvents: 'none' })
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  {TABLE_COLUMNS.map((col) => (
                    <TableCell key={col.id} sx={styles.tableCell}>{col.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {subprocessors.length > 0 ? (
                  subprocessors.map((sp) => (
                    <SubprocessorTableRow
                      key={sp.id}
                      subprocessor={sp}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      isFlashing={flashingRowId === sp.id}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography sx={styles.emptyStateText}>
                        No subprocessors found. Add your first subprocessor to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {!formData?.info?.subprocessor_visible && <Box sx={styles.overlay} />}
        </Box>

        {/* Edit Subprocessor Modal */}
        <Modal open={editModalOpen} onClose={handleCloseEditModal}>
          <Box sx={styles.modal}>
            <Box sx={styles.modalHeader}>
              <Typography sx={styles.modalTitle}>Edit subprocessor</Typography>
              <IconButton onClick={handleCloseEditModal} sx={{ p: 0 }}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Stack spacing={3}>
              <ModalField
                label="Company name"
                value={form.name}
                onChange={(value) => handleFormChange('name', value)}
                enabled={!!formData?.info?.subprocessor_visible}
              />
              <ModalField
                label="Purpose"
                value={form.purpose}
                onChange={(value) => handleFormChange('purpose', value)}
                enabled={!!formData?.info?.subprocessor_visible}
              />
              <ModalField
                label="URL"
                value={form.url}
                onChange={(value) => handleFormChange('url', value)}
                enabled={!!formData?.info?.subprocessor_visible}
              />
              <ModalField
                label="Location"
                value={form.location}
                onChange={(value) => handleFormChange('location', value)}
                enabled={!!formData?.info?.subprocessor_visible}
              />
              <CustomizableButton
                sx={{
                  ...styles.modalButton,
                  ...(formData?.info?.subprocessor_visible ? {} : styles.modalButtonDisabled)
                }}
                variant="contained"
                onClick={handleEditSave}
                isDisabled={!formData?.info?.subprocessor_visible || !form.name || !form.purpose || !form.url || !form.location}
                text="Edit subprocessor"
              />
            </Stack>
          </Box>
        </Modal>

        {/* Add Subprocessor Modal */}
        <Modal open={addModalOpen} onClose={handleCloseAddModal}>
          <Box sx={styles.modal}>
            <Box sx={styles.modalHeader}>
              <Typography sx={styles.modalTitle}>Add new subprocessor</Typography>
              <IconButton onClick={handleCloseAddModal} sx={{ p: 0 }}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Stack spacing={3}>
              <ModalField
                label="Company name"
                value={newSubprocessor.name}
                onChange={(value) => handleNewSubprocessorChange('name', value)}
                enabled={!!formData?.info?.subprocessor_visible}
              />
              <ModalField
                label="Purpose"
                value={newSubprocessor.purpose}
                onChange={(value) => handleNewSubprocessorChange('purpose', value)}
                enabled={!!formData?.info?.subprocessor_visible}
              />
              <ModalField
                label="URL"
                value={newSubprocessor.url}
                onChange={(value) => handleNewSubprocessorChange('url', value)}
                enabled={!!formData?.info?.subprocessor_visible}
              />
              <ModalField
                label="Location"
                value={newSubprocessor.location}
                onChange={(value) => handleNewSubprocessorChange('location', value)}
                enabled={!!formData?.info?.subprocessor_visible}
              />
              <CustomizableButton
                sx={{
                  ...styles.modalButton,
                  ...(formData?.info?.subprocessor_visible ? {} : styles.modalButtonDisabled)
                }}
                variant="contained"
                onClick={handleAddSubprocessor}
                isDisabled={!formData?.info?.subprocessor_visible || !newSubprocessor.name || !newSubprocessor.purpose || !newSubprocessor.url || !newSubprocessor.location}
                text="Add subprocessor"
              />
            </Stack>
          </Box>
        </Modal>
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

      {/* Error notification for add subprocessor */}
      {addSubprocessorError && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant="error"
            body={addSubprocessorError}
            isToast={true}
            onClick={() => setAddSubprocessorError(null)}
          />
        </Suspense>
      )}

      {/* Error notification for delete subprocessor */}
      {deleteSubprocessorError && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant="error"
            body={deleteSubprocessorError}
            isToast={true}
            onClick={() => setDeleteSubprocessorError(null)}
          />
        </Suspense>
      )}

      {/* Error notification for edit subprocessor */}
      {editSubprocessorError && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant="error"
            body={editSubprocessorError}
            isToast={true}
            onClick={() => setEditSubprocessorError(null)}
          />
        </Suspense>
      )}
    </Box>
  );
};

export default AITrustCenterSubprocessors; 