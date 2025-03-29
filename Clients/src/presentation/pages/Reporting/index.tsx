import React from 'react';
import { Stack, Typography, useTheme, Theme } from '@mui/material';
import { vwhomeHeading } from '../Home/1.0Home/style';

const Reporting = () => {
  const theme = useTheme();

  return (
    <Stack className="vwhome" gap={"20px"}>
      <ReportingHeader theme={theme} />
    </Stack>
  )
}

const ReportingHeader: React.FC<{ theme: Theme }> = ({ theme }) => (  
  <Stack className='vwhome-header'>
    <Typography sx={vwhomeHeading}>Reporting</Typography>
    <Typography
      sx={{
        color: theme.palette.text.secondary,
        fontSize: theme.typography.fontSize,
      }}
    >
      This section will generate a report based on the information entered in Compliance Tracker, Assessment Tracker, Vendors and Risks sections.
    </Typography>
  </Stack>
);
 
export default Reporting;