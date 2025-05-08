import React from 'react';
import { Modal, Box, Typography, Stack, IconButton, Button } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Project } from '../../../../domain/types/Project';
import { Framework } from '../../../../domain/types/Framework';
import {
  modalContainerStyle,
  modalHeaderStyle,
  modalCloseButtonStyle,
  modalDescriptionStyle,
  frameworkCardStyle,
  frameworkCardTitleStyle,
  frameworkCardAddedStyle,
  frameworkCardDescriptionStyle,
  modalDoneButtonStyle,
} from './styles';

interface AddFrameworkModalProps {
  open: boolean;
  onClose: () => void;
  frameworks: Framework[];
  project: Project;
}

const AddFrameworkModal: React.FC<AddFrameworkModalProps> = ({ open, onClose, frameworks, project }) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalContainerStyle}>
        {/* Header */}
        <Box sx={modalHeaderStyle}>
          <Typography sx={{ fontSize: 20, fontWeight: 600, color: '#232B3A' }}>AI Frameworks</Typography>
          <IconButton aria-label="Close modal" onClick={onClose} sx={modalCloseButtonStyle}>
            <CloseIcon fontSize="medium" />
          </IconButton>
        </Box>
        {/* Description */}
        <Box sx={{ p: 2, pt: 0 }}>
          <Typography sx={modalDescriptionStyle}>
            Add or remove AI frameworks to your platform. Selected frameworks will be integrated into your compliance workflow.
          </Typography>
          <Stack spacing={3}>
            {frameworks.map(fw => {
              const isAdded = project.framework?.some(pf => Number(pf.framework_id) === Number(fw.id));
              return (
                <Box
                  key={fw.id}
                  sx={frameworkCardStyle}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography sx={frameworkCardTitleStyle}>{fw.name}</Typography>
                    {isAdded && (
                      <Box sx={frameworkCardAddedStyle}>
                        <CheckIcon sx={{ color: '#13715B', fontSize: 18 }} />
                        <span>Added</span>
                      </Box>
                    )}
                  </Box>
                  <Typography sx={frameworkCardDescriptionStyle}>{fw.description}</Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>
        {/* Done Button */}
        <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-end', paddingTop: '20px' }}>
          <Button
            onClick={onClose}
            color="primary"
            variant="contained"
            sx={modalDoneButtonStyle}
          >
            Done
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default AddFrameworkModal; 