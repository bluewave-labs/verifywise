import { Stack, Typography } from '@mui/material';
import React from 'react';
import HelperIcon from '../../HelperIcon';

interface HeaderProps {
  titlesx?: any;
  subsx?: any;
  onHelperClick?: () => void;
}

const ReportingHeader: React.FC<HeaderProps> = ({
  titlesx,
  subsx,
  onHelperClick
}) => {
  return(
    <Stack className='vwhome-header'>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography sx={{...titlesx}}>Reporting</Typography>
        {onHelperClick && (
          <HelperIcon 
            onClick={onHelperClick}
            size="small"
          />
        )}
      </Stack>
      <Typography
        sx={{...subsx}}
      >
        Want a report? We'll create one using the info from your Compliance, Assessment, and Vendor/Risk sections.
      </Typography>
    </Stack>
  )
}

export default ReportingHeader