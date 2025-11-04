import React, { useState, lazy, Suspense, useRef } from "react";
import { Box, Stack } from "@mui/material";
import StandardModal from "../../Modals/StandardModal";
const GenerateReportFrom = lazy(() => import("./GenerateReportFrom"));
const DownloadReportForm = lazy(() => import("./DownloadReportFrom"));
import { handleAutoDownload } from "../../../../application/tools/fileDownload";
import { handleAlert } from "../../../../application/tools/alertUtils";
import Alert from "../../Alert";
import { useProjects } from "../../../../application/hooks/useProjects";
import useUsers from "../../../../application/hooks/useUsers";
import {
  IGenerateReportProps,
  IInputProps,
} from "../../../../domain/interfaces/iWidget";

const GenerateReportPopup: React.FC<IGenerateReportProps> = ({
  onClose,
  onReportGenerated,
  reportType,
}) => {
  const [isReportRequest, setIsReportRequest] = useState<boolean>(false);
  const [responseStatusCode, setResponseStatusCode] = useState<number>(200);
  const { users } = useUsers();
  const { data: projects } = useProjects();
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);
  const generateReportRef = useRef<(() => void) | null>(null);

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

  const handleGenerateReport = async (input: IInputProps) => {
    // Handle null project case
    if (!input.project) {
      handleToast("error", "Project not selected");
      return;
    }

    const currentProject = projects?.find(
      (project: { id: number | null }) => project.id === input.project
    );

    if (!currentProject) {
      handleToast("error", "Project not found");
      return;
    }
    setIsReportRequest(true);
    const owner = users.find((user: any) => user.id === currentProject.owner);
    const currentProjectOwner = owner ? `${owner.name} ${owner.surname}` : "";
    let reportTypeLabel = input.report_type;
    // Keep arrays as arrays; normalize known string values
    if (Array.isArray(input.report_type)) {
      reportTypeLabel = input.report_type;
    } else {
      switch (input.report_type) {
        case "Annexes report":
          reportTypeLabel = "Annexes report";
          break;
        case "Clauses report":
          reportTypeLabel = "Clauses report";
          break;
        case "Clauses and annexes report":
          reportTypeLabel = "Clauses and annexes report";
          break;
        case "All reports combined in one file":
          reportTypeLabel = "All reports";
          break;
        default:
          break;
      }
    }

    const body = {
      projectId: input.project,
      projectTitle: currentProject.project_title,
      projectOwner: currentProjectOwner,
      reportType: reportTypeLabel,
      reportName: input.report_name,
      frameworkId: input.framework,
      projectFrameworkId: input.projectFrameworkId,
    };
    const reportDownloadResponse = await handleAutoDownload(body);
    setResponseStatusCode(reportDownloadResponse);
    if (reportDownloadResponse === 200) {
      handleToast("success", "Report successfully downloaded.");
      // Call the callback to trigger refresh of reports list
      if (onReportGenerated) {
        onReportGenerated();
      }
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
  };

  const handleOnCloseModal = () => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    onClose();
  };

  const handleFormSubmit = () => {
    if (generateReportRef.current) {
      generateReportRef.current();
    }
  };

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

      <StandardModal
        isOpen={true}
        onClose={handleOnCloseModal}
        title={`Generate ${reportType === 'organization' ? 'Organization' : 'Project'} Report`}
        description={reportType === 'organization'
          ? 'Generate a comprehensive report for your entire organization.'
          : 'Pick the project you want to generate a report for.'
        }
        onSubmit={!isReportRequest ? handleFormSubmit : undefined}
        submitButtonText="Generate report"
        hideFooter={isReportRequest}
        maxWidth="450px"
      >
        <Stack sx={{ minHeight: isReportRequest ? '200px' : 'auto' }}>
          {isReportRequest ? (
            <Suspense fallback={<div>Loading...</div>}>
              <DownloadReportForm statusCode={responseStatusCode} />
            </Suspense>
          ) : (
            <Suspense fallback={<div>Loading...</div>}>
              <GenerateReportFrom
                onGenerate={handleGenerateReport}
                reportType={reportType}
                onSubmitRef={generateReportRef}
              />
            </Suspense>
          )}
        </Stack>
      </StandardModal>
    </Stack>
  );
};

export default GenerateReportPopup;
