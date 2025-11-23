import React, { useState } from 'react';
import { Box, Stack, Typography, MenuItem, Select, Button, SelectChangeEvent } from '@mui/material';
import { X } from 'lucide-react';

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
  const [isVisible, setIsVisible] = useState(false);

  const handleGroupChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setSelectedGroup(value);
    if (value) {
      setIsVisible(true);
      onGroupChange(value, sortOrder);
    }
  };

  const handleSortChange = (order: 'asc' | 'desc') => {
    setSortOrder(order);
    if (selectedGroup) {
      onGroupChange(selectedGroup, order);
    }
  };

  const handleClear = () => {
    setSelectedGroup('');
    setIsVisible(false);
    setSortOrder('asc');
    onGroupChange(null, 'asc');
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      {!isVisible && (
        <Typography
          component="button"
          onClick={() => setIsVisible(true)}
          sx={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#6b7280',
            textDecoration: 'underline',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            padding: 0,
            '&:hover': {
              color: '#374151',
            }
          }}
        >
          Group by
        </Typography>
      )}

      {isVisible && (
        <Stack direction="row" spacing={2} alignItems="center">
          <Stack direction="column" spacing={0.5}>
            <Typography
              component="p"
              sx={{
                fontSize: '11px',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: 0,
              }}
            >
              GROUP BY
            </Typography>
            <Select
              value={selectedGroup}
              onChange={handleGroupChange}
              displayEmpty
              sx={{
                fontSize: '13px',
                height: '36px',
                minWidth: '200px',
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
              }}
            >
              <MenuItem value="" disabled>
                <Typography sx={{ fontSize: '13px', color: '#9ca3af' }}>
                  Select field
                </Typography>
              </MenuItem>
              {options.map((option) => (
                <MenuItem key={option.id} value={option.id} sx={{ fontSize: '13px' }}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </Stack>

          <Stack
            direction="row"
            spacing={0}
            sx={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              height: '36px',
              alignSelf: 'flex-end',
            }}
          >
            <Button
              onClick={() => handleSortChange('asc')}
              sx={{
                fontSize: '13px',
                fontWeight: 500,
                padding: '8px 16px',
                backgroundColor: sortOrder === 'asc' ? '#f97316' : '#fff',
                color: sortOrder === 'asc' ? '#fff' : '#374151',
                border: 'none',
                borderRadius: 0,
                minWidth: '80px',
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
                padding: '8px 16px',
                backgroundColor: sortOrder === 'desc' ? '#f97316' : '#fff',
                color: sortOrder === 'desc' ? '#fff' : '#374151',
                border: 'none',
                borderRadius: 0,
                minWidth: '80px',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: sortOrder === 'desc' ? '#ea580c' : '#f9fafb',
                },
              }}
            >
              Z → A
            </Button>
          </Stack>

          <Box
            onClick={handleClear}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              alignSelf: 'flex-end',
              marginBottom: '6px',
              '&:hover': {
                opacity: 0.7,
              }
            }}
          >
            <X size={18} color="#6b7280" />
          </Box>
        </Stack>
      )}
    </Stack>
  );
};
