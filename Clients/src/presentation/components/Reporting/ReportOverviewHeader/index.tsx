import { Stack, Typography } from '@mui/material';
import React from 'react';

interface HeaderProps {
  titlesx?: any;
  subsx?: any
}

const ReportingHeader: React.FC<HeaderProps> = ({
  titlesx,
  subsx
}) => {
  return(
    <Stack className='vwhome-header'>
      <Typography sx={{...titlesx}}>Reporting</Typography>
      <Typography
        sx={{...subsx}}
      >
        Want a report? We'll create one using the info from your Compliance, Assessment, and Vendor/Risk sections.
      </Typography>
    </Stack>
  )
}

export default ReportingHeader