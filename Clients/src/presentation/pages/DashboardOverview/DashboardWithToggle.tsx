import React, { useState } from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ViewQuilt as GridIcon,
} from '@mui/icons-material';
import EnhancedDashboard from './EnhancedDashboard';

// Import the original dashboard - you'll need to export it from index.tsx
// For now, we'll create a placeholder

interface DashboardWithToggleProps {
  OriginalDashboard?: React.FC;
}

export const DashboardWithToggle: React.FC<DashboardWithToggleProps> = ({ OriginalDashboard }) => {
  const [viewMode, setViewMode] = useState<'classic' | 'grid'>('grid');

  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: 'classic' | 'grid' | null,
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  return (
    <Box>
      {/* View Mode Toggle - Only show if original dashboard is provided */}
      {OriginalDashboard && (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderBottom: 1, borderColor: 'divider' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="dashboard view mode"
            size="small"
          >
            <ToggleButton value="classic" aria-label="classic view">
              <Tooltip title="Classic Dashboard">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DashboardIcon fontSize="small" />
                  <Typography variant="body2">Classic</Typography>
                </Box>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="grid" aria-label="grid view">
              <Tooltip title="Drag & Drop Dashboard">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GridIcon fontSize="small" />
                  <Typography variant="body2">Grid View</Typography>
                </Box>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Render the selected dashboard */}
      {viewMode === 'classic' && OriginalDashboard ? (
        <OriginalDashboard />
      ) : (
        <EnhancedDashboard />
      )}
    </Box>
  );
};

export default DashboardWithToggle;