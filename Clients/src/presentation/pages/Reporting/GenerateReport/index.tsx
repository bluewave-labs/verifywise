import { lazy, Suspense, useState } from "react";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import { Stack, Dialog } from "@mui/material";
const GenerateReportPopup = lazy(
  () => import("../../../components/Reporting/GenerateReport")
);
const ReportStatus = lazy(() => import("./ReportStatus"));
import { styles } from "./styles";
import { useProjects } from "../../../../application/hooks/useProjects";
import { useModalKeyHandling } from "../../../../application/hooks/useModalKeyHandling";

interface GenerateReportProps {
  onReportGenerated?: () => void;
}

const GenerateReport: React.FC<GenerateReportProps> = ({
  onReportGenerated,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedReportType, setSelectedReportType] = useState<'project' | 'organization' | null>(null);
  const { data: projects } = useProjects();
  const isDisabled = projects?.length && projects?.length > 0 ? false : true;

  useModalKeyHandling({
    isOpen: isModalOpen,
    onClose: () => {
      setIsModalOpen(false);
      setSelectedReportType(null);
    },
  });

  return (
    <>
      <Stack sx={styles.container} direction="row" spacing={2}>
        <span data-joyride-id="generate-project-report-button">
          <CustomizableButton
            sx={{
              ...styles.buttonStyle,
              width: "fit-content",
              border: isDisabled ? "1px solid #dddddd" : "1px solid #13715B",
            }}
            variant="contained"
            text="Generate project report"
            onClick={() => {
              setSelectedReportType('project');
              setIsModalOpen(true);
            }}
            isDisabled={isDisabled}
          />
        </span>

        <span data-joyride-id="generate-organization-report-button">
          <CustomizableButton
            sx={{
              ...styles.buttonStyle,
              width: "fit-content",
              border: isDisabled ? "1px solid #dddddd" : "1px solid #13715B",
            }}
            variant="contained"
            text="Generate organization report"
            onClick={() => {
              setSelectedReportType('organization');
              setIsModalOpen(true);
            }}
            isDisabled={isDisabled}
          />
        </span>
        {/* Render generate report status */}
        <Suspense fallback={"loading..."}>
          <ReportStatus isDisabled={isDisabled} />
        </Suspense>
      </Stack>
      <Dialog 
        open={isModalOpen} 
        onClose={(_event, reason) => {
          if (reason !== 'backdropClick') {
            setIsModalOpen(false);
            setSelectedReportType(null);
          }
        }}
      >
        <Suspense fallback={"loading..."}>
          <GenerateReportPopup
            onClose={() => {
              setIsModalOpen(false);
              setSelectedReportType(null);
            }}
            onReportGenerated={onReportGenerated}
            reportType={selectedReportType}
          />
        </Suspense>
      </Dialog>
    </>
  );
};

export default GenerateReport;
