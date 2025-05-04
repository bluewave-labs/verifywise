import React, { useState, lazy, Suspense } from 'react'
import { IconButton, Box } from '@mui/material';
import CloseIcon from "@mui/icons-material/Close";
import {styles} from './styles';
const GenerateReportFrom = lazy(() => import('./GenerateReportFrom'));
const DownloadReportForm = lazy(() => import('./DownloadReportFrom'));
import { generatReport } from '../../../../application/repository/entity.repository';
import { handleAutoDownload } from '../../../../application/tools/fileDownload';

interface GenerateReportProps {
  onClose: () => void;
}

const GenerateReportPopup: React.FC<GenerateReportProps> = ({
  onClose
}) => {
  const [isReportRequest, setIsReportRequest] = useState<boolean>(false);  

  const handleGenerateReport = async () => {    
    setIsReportRequest(true);
    const body = {
      projectId: 1,
      userId: 1,
      reportType: 'Project risks report',
      reportName: ''
    }
    const report = await handleAutoDownload(body);
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
            onGenerate={handleGenerateReport}
          />
        </Suspense>
      }
    </Box>
  )
}

export default GenerateReportPopup