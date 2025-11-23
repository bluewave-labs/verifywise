import React, { useState } from 'react';
import { MenuItem, Select, Button, SelectChangeEvent, Stack } from '@mui/material';

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

  const handleGroupChange = (event: SelectChangeEvent) => {
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

  const handleSortChange = (order: 'asc' | 'desc') => {
    setSortOrder(order);
    if (selectedGroup) {
      onGroupChange(selectedGroup, order);
    }
  };

  return (
    <Stack direction="column" spacing={0}>
      <Select
        value={selectedGroup}
        onChange={handleGroupChange}
        displayEmpty
        sx={{
          fontSize: '13px',
          height: '34px',
          minWidth: '160px',
          backgroundColor: '#fff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e5e7eb',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#d1d5db',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#13715B',
            borderWidth: '1px',
          },
          '& .MuiSelect-select': {
            padding: '8px 12px',
            fontSize: '13px',
          }
        }}
      >
        <MenuItem value="" sx={{ fontSize: '13px' }}>
          No grouping
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option.id} value={option.id} sx={{ fontSize: '13px' }}>
            {option.label}
          </MenuItem>
        ))}
      </Select>

      {selectedGroup && (
        <Stack
          direction="row"
          spacing={0}
          sx={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
            height: '34px',
            marginTop: '8px',
          }}
        >
          <Button
            onClick={() => handleSortChange('asc')}
            sx={{
              fontSize: '13px',
              fontWeight: 500,
              padding: '6px 12px',
              backgroundColor: sortOrder === 'asc' ? '#f97316' : '#fff',
              color: sortOrder === 'asc' ? '#fff' : '#374151',
              border: 'none',
              borderRadius: 0,
              minWidth: '78px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: sortOrder === 'asc' ? '#ea580c' : '#f9fafb',
              },
              borderRight: '1px solid #e5e7eb',
            }}
          >
            A → Z
          </Button>
          <Button
            onClick={() => handleSortChange('desc')}
            sx={{
              fontSize: '13px',
              fontWeight: 500,
              padding: '6px 12px',
              backgroundColor: sortOrder === 'desc' ? '#f97316' : '#fff',
              color: sortOrder === 'desc' ? '#fff' : '#374151',
              border: 'none',
              borderRadius: 0,
              minWidth: '78px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: sortOrder === 'desc' ? '#ea580c' : '#f9fafb',
              },
            }}
          >
            Z → A
          </Button>
        </Stack>
      )}
    </Stack>
  );
};
