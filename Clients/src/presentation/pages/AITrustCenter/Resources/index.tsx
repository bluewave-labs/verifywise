import React, { useState } from "react";
import { Box, Typography, IconButton, Dialog, Table, TableBody, Stack, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import Toggle from '../../../components/Inputs/Toggle';
import { useStyles } from './styles';
import FileUploadComponent from '../../../components/FileUpload';
import CustomizableButton from '../../../vw-v2-components/Buttons';
import IconButtonComponent from '../../../components/IconButton';

import {
  INITIAL_RESOURCES,
  TABLE_COLUMNS,
  WARNING_MESSAGES
} from './constants';

// Helper component for Modal Input
const ModalInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  enabled: boolean;
}> = ({ label, value, onChange, enabled }) => {
  const styles = useStyles();
  
  return (
    <Box>
      <Typography fontSize={13} mb={1}>{label}</Typography>
      <input
        style={{
          ...styles.modalInput,
          ...(enabled ? styles.modalInputEnabled : styles.modalInputDisabled)
        }}
        value={value}
        onChange={e => enabled && onChange(e.target.value)}
        placeholder=""
        disabled={!enabled}
      />
    </Box>
  );
};

// Helper component for Modal Button
const ModalButton: React.FC<{
  text: string;
  onClick: () => void;
  enabled: boolean;
  width?: number;
  icon?: React.ReactNode;
}> = ({ text, onClick, enabled, width = 140, icon }) => {
  const styles = useStyles();
  
  return (
    <CustomizableButton
      variant="contained"
      sx={{
        ...(enabled ? styles.modalButton : styles.modalButtonDisabled),
        width,
      }}
      text={text}
      onClick={onClick}
      isDisabled={!enabled}
      icon={icon}
    />
  );
};

// Helper component for Resource Table Row
const ResourceTableRow: React.FC<{
  resource: any;
  enabled: boolean;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  onMakeVisible: (id: number) => void;
  onDownload: (id: number) => void;
}> = ({ resource, enabled, onDelete, onEdit, onMakeVisible, onDownload }) => {
  const styles = useStyles();
  
  return (
    <TableRow key={resource.name}>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography sx={styles.resourceName}>{resource.name}</Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Typography sx={styles.resourceType}>{resource.type}</Typography>
      </TableCell>
      <TableCell>
        {resource.visible ? (
          <VisibilityIcon sx={{ color: '#12B76A' }} />
        ) : (
          <VisibilityOffIcon sx={{ color: '#F04438' }} />
        )}
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
        </Box>
      </TableCell>
    </TableRow>
  );
};

const TrustCenterResources: React.FC = () => {
  const styles = useStyles();
  const [enabled, setEnabled] = useState(true);
  const [resources, setResources] = useState(INITIAL_RESOURCES);
  const [uploadDialog, setUploadDialog] = useState({ open: false, idx: -1 });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newResource, setNewResource] = useState<{ name: string; type: string; file: File | null }>({ name: '', type: '', file: null });

  const handleToggle = () => setEnabled((prev) => !prev);
  
  const handleOpenAddModal = () => {
    if (!enabled) return;
    setAddModalOpen(true);
    setNewResource({ name: '', type: '', file: null });
  };
  
  const handleCloseAddModal = () => setAddModalOpen(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!enabled) return;
    const file = e.target.files && e.target.files[0];
    if (file) setNewResource((prev) => ({ ...prev, file }));
  };
  
  const handleAddResource = () => {
    if (!enabled || !newResource.name || !newResource.type) return;
    setResources([
      ...resources,
      {
        id: Date.now(),
        name: newResource.name,
        type: newResource.type,
        visible: false,
        file: newResource.file
          ? { name: newResource.file.name, size: `${(newResource.file.size / 1024 / 1024).toFixed(1)}MB` }
          : null,
        uploaded: !!newResource.file,
      },
    ]);
    setAddModalOpen(false);
  };
  
  const handleEditResource = (resourceId: number) => {
    if (!enabled) return;
    console.log('edit resource', resourceId);
  };
  
  const handleDeleteResource = (resourceId: number) => {
    if (!enabled) return;
    setResources(resources.filter(resource => resource.id !== resourceId));
  };
  
  const handleMakeVisible = (resourceId: number) => {
    if (!enabled) return;
    setResources(resources.map(resource =>
      resource.id === resourceId
        ? { ...resource, visible: !resource.visible }
        : resource
    ));
  };
  
  const handleDownload = (resourceId: number) => {
    if (!enabled) return;
    const resource = resources.find(r => r.id === resourceId);
    if (resource && resource.file) {
      // Download logic here
    }
  };

  return (
    <Box>
      <Typography sx={styles.description}>
        Provide easy access to documentation and policies relevant to your AI governance, data security, compliance, and ethical practices. This section should act as a centralized repository where your customers, partners, and stakeholders can download, review, and understand key policy documents.
      </Typography>
      <Box sx={styles.container}>
        <Box sx={styles.resourcesHeader}>
          <Typography variant="subtitle1" sx={styles.title}>
            Resources and documents
          </Typography>
          <Box sx={styles.toggleRow}>
            <Typography sx={styles.toggleLabel}>Enabled and visible</Typography>
            <Toggle checked={enabled} onChange={handleToggle} />
          </Box>
        </Box>
        <Box sx={{ position: 'relative' }}>
          <TableContainer component={Paper} sx={{ 
            ...styles.tableContainer,
            opacity: enabled ? 1 : 0.5, 
            pointerEvents: enabled ? 'auto' : 'none' 
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
                {resources.map((resource) => (
                  <ResourceTableRow
                    key={resource.id}
                    resource={resource}
                    enabled={enabled}
                    onDelete={handleDeleteResource}
                    onEdit={handleEditResource}
                    onMakeVisible={handleMakeVisible}
                    onDownload={handleDownload}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {!enabled && <Box sx={styles.overlay} />}
        </Box>
        <Stack sx={{ width: "100%", mt: 4 }}>
          <CustomizableButton
            sx={styles.saveBtn}
            variant="contained"
            onClick={handleOpenAddModal}
            isDisabled={!enabled}
            text="Add new resource"
            icon={<AddIcon />}
          />
        </Stack>
        
        {/* Add Resource Modal */}
        {addModalOpen && (
          <Box sx={styles.modalOverlay}>
            <Box sx={styles.modal}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography fontWeight={600} fontSize={16}>Add a new resource</Typography>
                <IconButton onClick={handleCloseAddModal} sx={{ p: 0 }}>
                  <CloseIcon />
                </IconButton>
              </Stack>
              <Stack spacing={3}>
                <ModalInput
                  label="Resource name"
                  value={newResource.name}
                  onChange={(value) => setNewResource(r => ({ ...r, name: value }))}
                  enabled={enabled}
                />
                <ModalInput
                  label="Type or purpose of resource"
                  value={newResource.type}
                  onChange={(value) => setNewResource(r => ({ ...r, type: value }))}
                  enabled={enabled}
                />
                <Box>
                  <ModalButton
                    text={newResource.file ? newResource.file.name : 'Upload a file'}
                    onClick={() => document.getElementById('resource-file-input')?.click()}
                    enabled={enabled}
                    width={160}
                  />
                  <input
                    id="resource-file-input"
                    type="file"
                    accept="application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    disabled={!enabled}
                  />
                </Box>
                <Box display="flex" justifyContent="flex-end">
                  <ModalButton
                    text="Add resource"
                    onClick={handleAddResource}
                    enabled={enabled && !!newResource.name && !!newResource.type}
                  />
                </Box>
              </Stack>
            </Box>
          </Box>
        )}
        
        <Dialog open={uploadDialog.open} onClose={() => setUploadDialog({ open: false, idx: -1 })} maxWidth="xs">
          <FileUploadComponent
            open={uploadDialog.open}
            onClose={() => setUploadDialog({ open: false, idx: -1 })}
            onSuccess={() => {}}
            allowedFileTypes={["application/pdf"]}
          />
        </Dialog>
      </Box>
    </Box>
  );
};

export default TrustCenterResources; 