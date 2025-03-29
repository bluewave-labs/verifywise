import React from 'react'
import VWButton from '../../../vw-v2-components/Buttons'
import { useTheme, Typography, Stack } from '@mui/material';

const GenerateReport = () => {
  const theme = useTheme();
  
  return (
    <Stack 
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        padding: theme.spacing(50)
      }}
    >
      <VWButton
        sx={{
          width: { xs: "100%", sm: theme.spacing(80) },
          mb: theme.spacing(4),
          backgroundColor: "#4C7DE7",
          color: "#fff",
          border: "1px solid #4C7DE7",
          gap: 2,
        }}
        variant="contained"
        text="Generate your report"
      />
      <Typography>Clicking on this link will generate a report in Microsoft Word file you can modify.</Typography>
    </Stack>
  )
}

export default GenerateReport