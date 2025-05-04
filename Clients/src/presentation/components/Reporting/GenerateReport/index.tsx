import React, { useState, lazy, Suspense, useContext } from 'react'
import { IconButton, Box } from '@mui/material';
import CloseIcon from "@mui/icons-material/Close";
import {styles} from './styles';
const GenerateReportFrom = lazy(() => import('./GenerateReportFrom'));
const DownloadReportForm = lazy(() => import('./DownloadReportFrom'));
import { handleAutoDownload } from '../../../../application/tools/fileDownload';
import { VerifyWiseContext } from '../../../../application/contexts/VerifyWise.context';

interface GenerateReportProps {
  onClose: () => void;
}

const GenerateReportPopup: React.FC<GenerateReportProps> = ({
  onClose
}) => {
  const [isReportRequest, setIsReportRequest] = useState<boolean>(false);  
  const { currentProjectId, dashboardValues } = useContext(VerifyWiseContext);

  const handleGenerateReport = async (input: any) => {   
    setIsReportRequest(true);
    const currentProject = dashboardValues.projects.find((project: { id: string | null; }) => project.id === currentProjectId);         
    const owner = dashboardValues.users.find(
      (user: any) => user.id === parseInt(currentProject.owner)
    );
    const currentProjectOwner = owner ? `${owner.name} ${owner.surname}`: "";          

    const body = {
      projectId: currentProjectId,
      projectTitle: currentProject.project_title,
      projectOwner: currentProjectOwner,
      reportType: input.report_type,
      reportName: input.report_name
    }
    const report = await handleAutoDownload(body);
    onClose();
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