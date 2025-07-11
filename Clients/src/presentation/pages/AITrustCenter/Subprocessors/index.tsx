import React, { useState } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Stack } from "@mui/material";
import Toggle from '../../../components/Inputs/Toggle';
import IconButtonComponent from '../../../components/IconButton';
import { useStyles } from './styles';
import Field from '../../../components/Inputs/Field';
import CustomizableButton from '../../../vw-v2-components/Buttons';
import { Modal, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import {
  INITIAL_SUBPROCESSORS,
  TABLE_COLUMNS,
  WARNING_MESSAGES
} from './constants';

// Helper component for Subprocessor Table Row
const SubprocessorTableRow: React.FC<{
  subprocessor: any;
  enabled: boolean;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}> = ({ subprocessor, enabled, onDelete, onEdit }) => {
  const styles = useStyles();
  
  return (
    <TableRow key={subprocessor.id}>
      <TableCell>
        <Typography sx={styles.tableDataCell}>{subprocessor.company}</Typography>
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
            type="file"
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
  const styles = useStyles();
  const [enabled, setEnabled] = useState(true);
  const [subprocessors, setSubprocessors] = useState(INITIAL_SUBPROCESSORS);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ company: '', purpose: '', url: '', location: '' });

  const handleToggle = () => setEnabled((prev) => !prev);
  
  const handleEdit = (id: number) => {
    if (!enabled) return;
    const sp = subprocessors.find((s) => s.id === id);
    if (sp) {
      setForm({ company: sp.company, purpose: sp.purpose, url: sp.url, location: sp.location });
      setEditId(id);
      setEditModalOpen(true);
    }
  };
  
  const handleDelete = (id: number) => {
    if (!enabled) return;
    setSubprocessors(subprocessors.filter(sp => sp.id !== id));
  };
  
  const handleModalClose = () => {
    setEditModalOpen(false);
    setEditId(null);
  };
  
  const handleFormChange = (field: string, value: string) => {
    if (!enabled) return;
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleEditSave = () => {
    if (!enabled || editId === null) return;
    setSubprocessors((prev) => prev.map(sp => sp.id === editId ? { ...sp, ...form } : sp));
    setEditModalOpen(false);
    setEditId(null);
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
                {subprocessors.map((sp) => (
                  <SubprocessorTableRow
                    key={sp.id}
                    subprocessor={sp}
                    enabled={enabled}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {!enabled && <Box sx={styles.overlay} />}
        </Box>
        
        {/* Edit Subprocessor Modal */}
        <Modal open={editModalOpen} onClose={handleModalClose}>
          <Box sx={styles.modal}>
            <Box sx={styles.modalHeader}>
              <Typography sx={styles.modalTitle}>Edit subprocessor</Typography>
              <IconButton onClick={handleModalClose} sx={{ p: 0 }}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Stack spacing={3}>
              <ModalField
                label="Company name"
                value={form.company}
                onChange={(value) => handleFormChange('company', value)}
                enabled={enabled}
              />
              <ModalField
                label="Purpose"
                value={form.purpose}
                onChange={(value) => handleFormChange('purpose', value)}
                enabled={enabled}
              />
              <ModalField
                label="URL"
                value={form.url}
                onChange={(value) => handleFormChange('url', value)}
                enabled={enabled}
              />
              <ModalField
                label="Location"
                value={form.location}
                onChange={(value) => handleFormChange('location', value)}
                enabled={enabled}
              />
              <CustomizableButton
                sx={{
                  ...styles.modalButton,
                  ...(enabled ? {} : styles.modalButtonDisabled)
                }}
                variant="contained"
                onClick={handleEditSave}
                isDisabled={!enabled}
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