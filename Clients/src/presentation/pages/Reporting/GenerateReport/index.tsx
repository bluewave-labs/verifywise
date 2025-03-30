import React, {useState} from 'react'
import VWButton from '../../../vw-v2-components/Buttons'
import { useTheme, Typography, Stack, Dialog } from '@mui/material';
import GenerateReportPopup from '../../../components/GenerateReport';

const GenerateReport = () => {
  const theme = useTheme();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  return (
    <>
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
            width: { xs: "100%", sm: theme.spacing(110) },
            mb: theme.spacing(4),
            backgroundColor: "#4C7DE7",
            color: "#fff",
            border: "1px solid #4C7DE7",
            gap: 2,
          }}
          variant="contained"
          text="Generate your report"
          onClick={() => setIsModalOpen(true)}
        />
        <Typography 
          sx={{
            color: theme.palette.text.secondary,
            fontSize: theme.typography.fontSize,
          }}
        >Clicking on this link will generate a report in Microsoft Word file you can modify.</Typography>
      </Stack>
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <GenerateReportPopup 
          onClose={() => setIsModalOpen(false)}
        />
      </Dialog>
    </>
  )
}

export default GenerateReport