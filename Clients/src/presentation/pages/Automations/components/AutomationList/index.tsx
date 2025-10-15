import React, { useState } from 'react';
import {
  Stack,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  Box,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  Zap,
  ZapOff,
} from 'lucide-react';
import Button from '../../../../components/Button';
import CustomizableButton from '../../../../components/Button/CustomizableButton';
import { SearchBox } from '../../../../components/Search';
import Toggle from '../../../../components/Inputs/Toggle';
import Field from '../../../../components/Inputs/Field';
import { Automation } from '../../../../../domain/types/Automation';

interface AutomationListProps {
  automations: Automation[];
  selectedAutomationId: string | null;
  searchQuery: string;
  isLoading: boolean;
  onSelectAutomation: (id: string) => void;
  onCreateAutomation: () => void;
  onDeleteAutomation: (id: string) => void;
  onDuplicateAutomation: (id: string) => void;
  onToggleAutomation: (id: string) => void;
  onRenameAutomation: (id: string, newName: string) => void;
  onSearchChange: (query: string) => void;
}

const AutomationList: React.FC<AutomationListProps> = ({
  automations,
  selectedAutomationId,
  searchQuery,
  isLoading,
  onSelectAutomation,
  onCreateAutomation,
  onDeleteAutomation,
  onDuplicateAutomation,
  onToggleAutomation,
  onRenameAutomation,
  onSearchChange,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMenuAutomation, setSelectedMenuAutomation] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, automationId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedMenuAutomation(automationId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMenuAutomation(null);
  };

  const handleRename = () => {
    const automation = automations.find(a => a.id === selectedMenuAutomation);
    if (automation) {
      setNewName(automation.name);
      setRenameDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleRenameSubmit = () => {
    if (selectedMenuAutomation && newName.trim()) {
      onRenameAutomation(selectedMenuAutomation, newName.trim());
    }
    setRenameDialogOpen(false);
    setNewName('');
    setSelectedMenuAutomation(null);
  };

  const handleDuplicate = () => {
    if (selectedMenuAutomation) {
      onDuplicateAutomation(selectedMenuAutomation);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedMenuAutomation) {
      onDeleteAutomation(selectedMenuAutomation);
    }
    handleMenuClose();
  };

  const getStatusIcon = (automation: Automation) => {
    if (!automation.isActive) {
      return <ZapOff size={14} color={theme.palette.text.disabled} />;
    }

    switch (automation.status) {
      case 'active':
        return <Zap size={14} color={theme.palette.success.main} />;
      case 'error':
        return <Zap size={14} color={theme.palette.error.main} />;
      default:
        return <ZapOff size={14} color={theme.palette.text.disabled} />;
    }
  };

  const getStatusText = (automation: Automation) => {
    if (!automation.isActive) return 'Inactive';

    switch (automation.status) {
      case 'active':
        return 'Active';
      case 'error':
        return 'Error';
      default:
        return 'Inactive';
    }
  };

  return (
    <Stack
      sx={{
        height: '100%',
        backgroundColor: 'transparent',
      }}
    >
      {/* Header */}
      <Stack spacing={2} sx={{ p: '16px', borderBottom: `1px solid ${theme.palette.border.light}` }}>
        <Typography variant="h6" sx={{ fontSize: '15px', fontWeight: 600 }}>
          Automations
        </Typography>

        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={onCreateAutomation}
          sx={{ width: '100%', pb: 1 }}
        >
          Create new automation
        </Button>

        <SearchBox
          placeholder="Find automations..."
          value={searchQuery}
          onChange={onSearchChange}
          sx={{ mt: '8px' }}
        />
      </Stack>

      {/* Automation List */}
      <Stack sx={{ flex: 1, overflow: 'hidden' }}>
        {isLoading ? (
          <Stack spacing={1} sx={{ p: 2 }}>
            {[1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  height: 60,
                  backgroundColor: theme.palette.action.hover,
                  borderRadius: 1,
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }}
              />
            ))}
          </Stack>
        ) : automations.length === 0 ? (
          <Stack
            spacing={2}
            alignItems="center"
            justifyContent="center"
            sx={{ flex: 1, p: '16px', textAlign: 'center' }}
          >
            <Typography color="textSecondary" variant="body2" sx={{ fontWeight: 600 }}>
              {searchQuery ? 'No automations found' : 'No automations yet'}
            </Typography>
            {!searchQuery && (
              <Typography color="textSecondary" variant="body2" sx={{ fontSize: 12, fontWeight: 300 }}>
                Create your first automation to get started
              </Typography>
            )}
          </Stack>
        ) : (
          <List sx={{ p: '16px', overflow: 'auto', flex: 1 }}>
            {automations.map((automation) => (
              <ListItemButton
                key={automation.id}
                selected={selectedAutomationId === automation.id}
                onClick={() => onSelectAutomation(automation.id)}
                sx={{
                  borderRadius: 1,
                  mb: '8px',
                  backgroundColor: '#caadad14',
                  border: `1px solid #d9d9d9`,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.action.selected,
                    borderColor: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.action.selected,
                    },
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {automation.name}
                    </Typography>
                  }
                  secondary={
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
                          fontSize: 11,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          mb: 1,
                        }}
                      >
                        {automation.description}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                        <Toggle
                          checked={automation.isActive}
                          onChange={(e) => {
                            e.stopPropagation();
                            onToggleAutomation(automation.id);
                          }}
                          size="small"
                        />
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>
                          {automation.isActive ? 'ON' : 'OFF'}
                        </Typography>
                      </Stack>
                    </Stack>
                  }
                />
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, automation.id)}
                  sx={{ ml: 1 }}
                >
                  <MoreVertical size={16} />
                </IconButton>
              </ListItemButton>
            ))}
          </List>
        )}
      </Stack>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            boxShadow: theme.shadows[3],
            borderRadius: 1,
            minWidth: 160,
          },
        }}
      >
        <MenuItem onClick={handleRename}>
          <Edit2 size={16} style={{ marginRight: 8 }} />
          Rename
        </MenuItem>
        <MenuItem onClick={handleDuplicate}>
          <Copy size={16} style={{ marginRight: 8 }} />
          Duplicate
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: theme.palette.error.main }}>
          <Trash2 size={16} style={{ marginRight: 8 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Rename Automation</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Field
            label="Automation Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter automation name"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleRenameSubmit();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <CustomizableButton onClick={() => setRenameDialogOpen(false)} variant="outlined">
            Cancel
          </CustomizableButton>
          <CustomizableButton onClick={handleRenameSubmit} variant="contained" disabled={!newName.trim()}>
            Rename
          </CustomizableButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default AutomationList;