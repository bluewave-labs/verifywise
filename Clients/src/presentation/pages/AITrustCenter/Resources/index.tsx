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

const initialResources = [
  { id: 1, name: 'AI Ethics and Principles', type: 'Continuous Learning and Model Update Policy', visible: true, file: { name: 'ethics.pdf', size: '1.2MB' }, uploaded: true },
  { id: 2, name: 'Algorithmic Transparency Report', type: 'AI Governance Framework', visible: false, file: { name: 'transparency.pdf', size: '1.1MB' }, uploaded: true },
  { id: 3, name: 'Bias and Fairness Assessment', type: 'Data Annotation and Labeling Standards', visible: false, file: null, uploaded: false },
  { id: 4, name: 'Risk management', type: 'Ethical AI Use Cases and Exclusions', visible: true, file: { name: 'risk.pdf', size: '1.3MB' }, uploaded: true },
];

const columns = [
  { id: 'name', label: 'RESOURCE NAME' },
  { id: 'type', label: 'TYPE OR PURPOSE OF RESOURCE' },
  { id: 'visible', label: 'VISIBILITY' },
  { id: 'action', label: 'ACTION' },
];

const TrustCenterResources: React.FC = () => {
  const styles = useStyles();
  const [enabled, setEnabled] = useState(true);
  const [resources, setResources] = useState(initialResources);
  const [uploadDialog, setUploadDialog] = useState({ open: false, idx: -1 });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newResource, setNewResource] = useState<{ name: string; type: string; file: File | null }>({ name: '', type: '', file: null });

  const handleToggle = () => setEnabled((prev) => !prev);
  const handleOpenAddModal = () => {
    setAddModalOpen(true);
    setNewResource({ name: '', type: '', file: null });
  };
  const handleCloseAddModal = () => setAddModalOpen(false);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) setNewResource((prev) => ({ ...prev, file }));
  };
  const handleAddResource = () => {
    if (!newResource.name || !newResource.type) return;
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
  // const handleEditResource = (resourceId: number) => {};
  const handleDeleteResource = (resourceId: number) => {
    setResources(resources.filter(resource => resource.id !== resourceId));
  };
  const handleMouseEvent = (_: React.SyntheticEvent) => {};
  const handleMakeVisible = (resourceId: number) => {
    setResources(resources.map(resource =>
      resource.id === resourceId
        ? { ...resource, visible: !resource.visible }
        : resource
    ));
  };
  const handleDownload = (resourceId: number) => {
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
        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.id} sx={{ fontWeight: 600, fontSize: 13 }}>{col.label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource.name}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {/* <CheckCircleOutlineIcon sx={styles.checkIcon} /> */}
                      <Typography sx={styles.resourceName}>{resource.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, color: '#475467' }}>{resource.type}</Typography>
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
                        onDelete={() => handleDeleteResource(resource.id)}
                        onEdit={() => handleEditResource(resource.id)}
                        onMouseEvent={handleMouseEvent}
                        onMakeVisible={() => handleMakeVisible(resource.id)}
                        onDownload={() => handleDownload(resource.id)}
                        isVisible={resource.visible}
                        warningTitle="Delete this resource?"
                        warningMessage="When you delete this resource, all data related to this resource will be removed. This action is non-recoverable."
                        type="Resource"
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack sx={{ width: "100%", mt: 4 }}>
          <CustomizableButton
            sx={styles.saveBtn}
            variant="contained"
            onClick={handleOpenAddModal}
            isDisabled={false}
            text="Add new resource"
            icon={<AddIcon />}
          />
        </Stack>
        {/* Add Resource Modal */}
        {addModalOpen && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              bgcolor: 'rgba(0,0,0,0.12)',
              zIndex: 1300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                bgcolor: '#fff',
                borderRadius: 2,
                boxShadow: 3,
                p: 6,
                minWidth: 350,
                maxWidth: 400,
                width: '100%',
                position: 'relative',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography fontWeight={600} fontSize={16}>Add a new resource</Typography>
                <IconButton onClick={handleCloseAddModal} sx={{ p: 0 }}>
                  <CloseIcon />
                </IconButton>
              </Stack>
              <Stack spacing={3}>
                <Box>
                  <Typography fontSize={13} mb={1}>Resource name</Typography>
                  <input
                    style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #E0E0E0', fontSize: 13 }}
                    value={newResource.name}
                    onChange={e => setNewResource(r => ({ ...r, name: e.target.value }))}
                    placeholder=""
                  />
                </Box>
                <Box>
                  <Typography fontSize={13} mb={1}>Type or purpose of resource</Typography>
                  <input
                    style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #E0E0E0', fontSize: 13 }}
                    value={newResource.type}
                    onChange={e => setNewResource(r => ({ ...r, type: e.target.value }))}
                    placeholder=""
                  />
                </Box>
                <Box>
                  <CustomizableButton
                    variant="contained"
                    sx={{ backgroundColor: '#13715B', border: '1px solid #13715B', width: 160, mb: 2 }}
                    text={newResource.file ? newResource.file.name : 'Upload a file'}
                    onClick={() => document.getElementById('resource-file-input')?.click()}
                  />
                  <input
                    id="resource-file-input"
                    type="file"
                    accept="application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </Box>
                <Box display="flex" justifyContent="flex-end">
                  <CustomizableButton
                    variant="contained"
                    sx={{ backgroundColor: '#13715B', border: '1px solid #13715B', width: 140 }}
                    text="Add resource"
                    onClick={handleAddResource}
                    isDisabled={!newResource.name || !newResource.type}
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