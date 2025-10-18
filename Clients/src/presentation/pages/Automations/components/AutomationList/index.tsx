import React, { useState } from 'react';
import {
  Stack,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  useTheme,
  Box,
  Tooltip,
} from '@mui/material';
import {
  Plus,
  Trash2,
} from 'lucide-react';
import Button from '../../../../components/Button';
import { SearchBox } from '../../../../components/Search';
import Toggle from '../../../../components/Inputs/Toggle';
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

  const handleDelete = (event: React.MouseEvent<HTMLElement>, automationId: string) => {
    event.stopPropagation();
    onDeleteAutomation(automationId);
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
                <Tooltip title="Delete automation">
                  <IconButton
                    size="small"
                    onClick={(e) => handleDelete(e, automation.id)}
                    sx={{ ml: 1, color: theme.palette.error.main }}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Tooltip>
              </ListItemButton>
            ))}
          </List>
        )}
      </Stack>
    </Stack>
  );
};

export default AutomationList;