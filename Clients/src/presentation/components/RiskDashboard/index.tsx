import React from 'react';
import { Stack } from '@mui/material';
import VendorRisksCard from './VendorRisksCard';
import ProjectRisksCard from './ProjectRisksCard';

interface RiskDashboardProps {
  projectId?: string;
  onVendorRisksViewDetails?: () => void;
  onProjectRisksViewDetails?: () => void;
}

const RiskDashboard: React.FC<RiskDashboardProps> = ({
  projectId,
  onVendorRisksViewDetails,
  onProjectRisksViewDetails,
}) => {
  return (
    <Stack 
      direction={{ xs: 'column', md: 'row' }} 
      spacing={3}
      sx={{ 
        width: '100%',
        alignItems: 'stretch',
      }}
    >
      <VendorRisksCard
        projectId={projectId}
        onViewDetails={onVendorRisksViewDetails}
      />
      <ProjectRisksCard
        projectId={projectId}
        onViewDetails={onProjectRisksViewDetails}
      />
    </Stack>
  );
};

export default RiskDashboard;