import React, { useState, lazy, Suspense } from 'react'
import { IconButton, Box } from '@mui/material';
import CloseIcon from "@mui/icons-material/Close";
import {styles} from './styles';
const GenerateReportFrom = lazy(() => import('./GenerateReportFrom'));
const DownloadReportForm = lazy(() => import('./DownloadReportFrom'));

interface GenerateReportProps {
  onClose: () => void;
}

const GenerateReportPopup: React.FC<GenerateReportProps> = ({
  onClose
}) => {
  const [isReportRequest, setIsReportRequest] = useState<boolean>(false);  

  const handleGenerateForm = () => {    
    setIsReportRequest(true);
  }

  return (
    <Box 
      sx={{
        ...styles.formContainer, 
        ...(isReportRequest && styles.contentCenter)
      }}
      component="form"
    >
      <IconButton onClick={onClose} sx={styles.iconButton}>
        <CloseIcon sx={styles.closeButton} />
      </IconButton>
      {isReportRequest ? 
        <Suspense fallback={<div>Loading...</div>}>
          <DownloadReportForm />
        </Suspense> : 
        <Suspense fallback={<div>Loading...</div>}>
          <GenerateReportFrom 
            onGenerate={handleGenerateForm}
          />
        </Suspense>
      }
    </Box>
  )
}

export default GenerateReportPopup