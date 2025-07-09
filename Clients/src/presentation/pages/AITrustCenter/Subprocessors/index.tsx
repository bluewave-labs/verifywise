import React, { useState } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Stack } from "@mui/material";
import Toggle from '../../../components/Inputs/Toggle';
import IconButtonComponent from '../../../components/IconButton';
import { useStyles } from './styles';
import Field from '../../../components/Inputs/Field';
import CustomizableButton from '../../../vw-v2-components/Buttons';
import { Modal, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const initialSubprocessors = [
  { id: 1, company: 'Google', url: 'https://google.com', purpose: 'We use Gemini', location: 'San Francisco' },
  { id: 2, company: 'Meta', url: 'https://meta.com', purpose: 'We use their OS LLM', location: 'San Francisco' },
  { id: 3, company: 'Microsoft', url: 'https://microsoft.com', purpose: 'We use their Azure AI foundry', location: 'Redmond' },
  { id: 4, company: 'Nvidia', url: 'https://nvidia.com', purpose: 'We use their AI services', location: 'Santa Clara' },
];

const columns = [
  { id: 'company', label: 'COMPANY NAME' },
  { id: 'url', label: 'URL' },
  { id: 'purpose', label: 'PURPOSE' },
  { id: 'location', label: 'LOCATION' },
  { id: 'action', label: 'ACTION' },
];

const AITrustCenterSubprocessors: React.FC = () => {
  const styles = useStyles();
  const [enabled, setEnabled] = useState(true);
  const [subprocessors, setSubprocessors] = useState(initialSubprocessors);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ company: '', purpose: '', url: '', location: '' });

  const handleToggle = () => setEnabled((prev) => !prev);
  const handleEdit = (id: number) => {
    const sp = subprocessors.find((s) => s.id === id);
    if (sp) {
      setForm({ company: sp.company, purpose: sp.purpose, url: sp.url, location: sp.location });
      setEditId(id);
      setEditModalOpen(true);
    }
  };
  const handleDelete = (id: number) => setSubprocessors(subprocessors.filter(sp => sp.id !== id));
  const handleMouseEvent = (_: React.SyntheticEvent) => {};
  const handleModalClose = () => {
    setEditModalOpen(false);
    setEditId(null);
  };
  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleEditSave = () => {
    if (editId !== null) {
      setSubprocessors((prev) => prev.map(sp => sp.id === editId ? { ...sp, ...form } : sp));
      setEditModalOpen(false);
      setEditId(null);
    }
  };

  return (
    <Box>
      <Typography sx={styles.description}>
        The subprocessor section is an important part of your AI Trust Center. It provides transparency about third-party vendors that process or store data on behalf of your organization. Subprocessors are integral to various operations, from AI model hosting and data storage to compliance monitoring and analytics.
      </Typography>
      <Box sx={styles.container}>
        <Box sx={styles.subprocessorsHeader}>
          <Typography variant="subtitle1" sx={styles.title}>
            Subprocessors
          </Typography>
          <Box sx={styles.toggleRow}>
            <Typography sx={styles.toggleLabel}>Enabled and visible</Typography>
            <Toggle checked={enabled} onChange={handleToggle} />
          </Box>
        </Box>
        <Box sx={{ position: 'relative' }}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none', opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? 'auto' : 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell key={col.id} sx={{ fontWeight: 600, fontSize: 13 }}>{col.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {subprocessors.map((sp) => (
                  <TableRow key={sp.id}>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, color: '#475467' }}>{sp.company}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, color: '#475467' }}>{sp.url}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, color: '#475467' }}>{sp.purpose}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, color: '#475467' }}>{sp.location}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButtonComponent
                          id={sp.id}
                          onDelete={() => handleDelete(sp.id)}
                          onEdit={() => handleEdit(sp.id)}
                          onMouseEvent={handleMouseEvent}
                          type="file"
                          warningTitle="Are you sure you want to remove this subprocessor?"
                          warningMessage="If you delete this subprocessor, it will be removed from the table and won't be visible in the public AI Trust Center."
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {!enabled && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              bgcolor: 'rgba(255,255,255,0.6)',
              zIndex: 2,
              pointerEvents: 'auto',
              borderRadius: 2,
            }} />
          )}
        </Box>
        {/* Edit Subprocessor Modal */}
        <Modal open={editModalOpen} onClose={handleModalClose}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: '#fff',
            borderRadius: 2,
            boxShadow: 3,
            p: 6,
            minWidth: 350,
            maxWidth: 400,
            width: '100%',
            outline: 'none',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography fontWeight={600} fontSize={16}>Edit subprocessor</Typography>
              <IconButton onClick={handleModalClose} sx={{ p: 0 }}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Stack spacing={3}>
              <Field
                label="Company name"
                value={form.company}
                onChange={e => handleFormChange('company', e.target.value)}
                sx={{ width: '100%' }}
              />
              <Field
                label="Purpose"
                value={form.purpose}
                onChange={e => handleFormChange('purpose', e.target.value)}
                sx={{ width: '100%' }}
              />
              <Field
                label="URL"
                value={form.url}
                onChange={e => handleFormChange('url', e.target.value)}
                sx={{ width: '100%' }}
              />
              <Field
                label="Location"
                value={form.location}
                onChange={e => handleFormChange('location', e.target.value)}
                sx={{ width: '100%' }}
              />
              <CustomizableButton
                sx={{ mt: 2, alignSelf: 'flex-end', backgroundColor: '#13715B', border: '1px solid #13715B', color: '#fff', borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                variant="contained"
                onClick={handleEditSave}
                isDisabled={false}
                text="Edit subprocessor"
              />
            </Stack>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
};

export default AITrustCenterSubprocessors; 