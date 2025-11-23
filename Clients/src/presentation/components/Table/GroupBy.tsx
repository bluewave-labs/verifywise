import React, { useState } from 'react';
import { Button, Stack, Popover, Box, Typography } from '@mui/material';
import { X, TableRowsSplit } from 'lucide-react';
import Select from '../Inputs/Select';
import ButtonToggle from '../ButtonToggle';

export interface GroupByOption {
  id: string;
  label: string;
}

export interface GroupByProps {
  options: GroupByOption[];
  onGroupChange: (groupBy: string | null, sortOrder: 'asc' | 'desc') => void;
  defaultGroupBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
}

export const GroupBy: React.FC<GroupByProps> = ({
  options,
  onGroupChange,
  defaultGroupBy,
  defaultSortOrder = 'asc',
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>(defaultGroupBy || '');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleGroupChange = (event: any) => {
    const value = event.target.value;
    setSelectedGroup(value);
    if (value === '') {
      // Clear grouping
      onGroupChange(null, 'asc');
      setSortOrder('asc');
    } else {
      onGroupChange(value, sortOrder);
    }
  };

  const handleSortChange = (value: string) => {
    const order = value as 'asc' | 'desc';
    setSortOrder(order);
    if (selectedGroup) {
      onGroupChange(selectedGroup, order);
    }
  };

  const handleClear = () => {
    setSelectedGroup('');
    setSortOrder('asc');
    onGroupChange(null, 'asc');
    handleClose();
  };

  const open = Boolean(anchorEl);

  // Prepare items for Select component
  const selectItems = [
    { _id: '', name: 'Select field' },
    ...options.map(option => ({ _id: option.id, name: option.label }))
  ];

  return (
    <>
      <Button
        onClick={handleClick}
        variant="outlined"
        sx={{
          fontSize: '13px',
          fontWeight: 500,
          padding: '6px 12px',
          textTransform: 'none',
          color: '#374151',
          borderColor: '#e5e7eb',
          height: '34px',
          minWidth: selectedGroup ? '100px' : '80px',
          backgroundColor: open ? '#f0fdf4' : 'transparent',
          '&:hover': {
            borderColor: '#d1d5db',
            backgroundColor: '#f0fdf4',
          },
        }}
      >
        <TableRowsSplit size={16} color="#10b981" style={{ marginRight: '6px' }} />
        Group {selectedGroup && '(1)'}
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            sx: {
              marginTop: '8px',
              padding: '16px',
              minWidth: '480px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
            }
          }
        }}
      >
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              GROUP BY
            </Typography>
            {selectedGroup && (
              <Box
                onClick={handleClear}
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  '&:hover': { opacity: 0.7 }
                }}
              >
                <X size={16} color="#6b7280" />
              </Box>
            )}
          </Stack>

          {/* Field Selector and Sort Buttons - Side by Side */}
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Field Selector - 35% width */}
            <Box sx={{ flex: '0 0 35%' }}>
              <Select
                id="group-by-field"
                value={selectedGroup}
                items={selectItems}
                onChange={handleGroupChange}
                sx={{ width: '100%' }}
              />
            </Box>

            {/* Sort Buttons - Always visible */}
            <Box sx={{ flex: '0 0 auto', display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ width: '180px' }}>
                <ButtonToggle
                  options={[
                    { label: 'A → Z', value: 'asc' },
                    { label: 'Z → A', value: 'desc' }
                  ]}
                  value={sortOrder}
                  onChange={handleSortChange}
                  height={34}
                />
              </Box>
            </Box>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
};
