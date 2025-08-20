import React, { useState, lazy, Suspense, useContext, useRef } from 'react'
import { IconButton, Box, Stack } from '@mui/material';
import CloseIcon from "@mui/icons-material/Close";
import {styles} from './styles';
const GenerateReportFrom = lazy(() => import('./GenerateReportFrom'));
const DownloadReportForm = lazy(() => import('./DownloadReportFrom'));
import { handleAutoDownload } from '../../../../application/tools/fileDownload';
import { VerifyWiseContext } from '../../../../application/contexts/VerifyWise.context';
import { handleAlert } from '../../../../application/tools/alertUtils';
import Alert from '../../Alert';

interface GenerateReportProps {
  onClose: () => void;
}

interface InputProps {
  report_type: string;
  report_name: string;
  project: number;
  framework: number;
  projectFrameworkId: number;
}

const GenerateReportPopup: React.FC<GenerateReportProps> = ({
  onClose
}) => {
  const [isReportRequest, setIsReportRequest] = useState<boolean>(false);
  const [responseStatusCode, setResponseStatusCode] = useState<number>(200);  
  const { dashboardValues, users } = useContext(VerifyWiseContext);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleToast = (type: any, message: string) => {
    handleAlert({
      variant: type,
      body: message,
      setAlert,
    });
    clearTimerRef.current = setTimeout(() => {
      setAlert(null);
      onClose();
    }, 3000);
  };

  const handleGenerateReport = async (input: InputProps) => {       
    const currentProject = dashboardValues.projects.find((project: { id: number | null; }) => project.id === input.project);
    
    if (!currentProject) {
      handleToast("error", "Project not found");
      return;
    }
    setIsReportRequest(true);
    const owner = users.find(
      (user: any) => user.id === parseInt(currentProject.owner)
    );
    const currentProjectOwner = owner ? `${owner.name} ${owner.surname}`: "";          
    let reportTypeLabel = input.report_type;
    switch(input.report_type){
      case "Annexes report":
        reportTypeLabel = "Annexes report"
        break;      
      case "Clauses report":
        reportTypeLabel = "Clauses report"
        break; 
      case "Clauses and annexes report":
        reportTypeLabel = "Clauses and annexes report"
        break;     
      case "All reports combined in one file":
        reportTypeLabel = "All reports"
        break;
      default:
        break;
    }

    const body = {
      projectId: input.project,
      projectTitle: currentProject.project_title,
      projectOwner: currentProjectOwner,
      reportType: reportTypeLabel,
      reportName: input.report_name,
      frameworkId: input.framework,
      projectFrameworkId: input.projectFrameworkId
    }
    const reportDownloadResponse = await handleAutoDownload(body);
    setResponseStatusCode(reportDownloadResponse);
    if(reportDownloadResponse === 200){
      handleToast(
        "success", 
        "Report successfully downloaded.");
    } else if (reportDownloadResponse === 403) {
      handleToast(
        "warning",
        "Access denied: Unauthorized user to download the report."
      );
    } else {
      handleToast(
        "error",
        "Unexpected error occurs while downloading the report."
      );
    }
  }

  const handleOnCloseModal = () => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    onClose();
  }

  return (
    <Stack>
      {alert && (
        <Suspense fallback={<div>Loading...</div>}>
          <Box>
            <Alert
              variant={alert.variant}
              title={alert.title}
              body={alert.body}
              isToast={true}
              onClick={() => setAlert(null)}
            />
          </Box>
        </Suspense>
      )}
    
      <Box 
        sx={{
          ...styles.formContainer, 
          ...(isReportRequest && styles.contentCenter)
        }}
        component="form"
      >
        <IconButton onClick={handleOnCloseModal} sx={styles.iconButton}>
          <CloseIcon sx={styles.closeButton} />
        </IconButton>
        {isReportRequest ? 
          <Suspense fallback={<div>Loading...</div>}>
            <DownloadReportForm statusCode={responseStatusCode} />
          </Suspense> : 
          <Suspense fallback={<div>Loading...</div>}>
            <GenerateReportFrom 
              onGenerate={handleGenerateReport}
            />
          </Suspense>
        }
      </Box>
    </Stack>
  )
}

export default GenerateReportPopup