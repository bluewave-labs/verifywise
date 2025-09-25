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
  const { data: projects } = useProjects();
  const isDisabled = projects?.length && projects?.length > 0 ? false : true;

  useModalKeyHandling({
    isOpen: isModalOpen,
    onClose: () => setIsModalOpen(false),
  });

  return (
    <>
      <Stack sx={styles.container} direction="row" spacing={2}>
        <CustomizableButton
          sx={{
            ...styles.buttonStyle,
            width: "fit-content",
            border: isDisabled ? "1px solid #dddddd" : "1px solid #13715B",
          }}
          variant="contained"
          text="Generate Project Report"
          onClick={() => setIsModalOpen(true)}
          isDisabled={isDisabled}
        />

        <CustomizableButton
          sx={{
            ...styles.buttonStyle,
            width: "fit-content",
            border: isDisabled ? "1px solid #dddddd" : "1px solid #13715B",
          }}
          variant="contained"
          text="Generate Organization Report"
          onClick={() => setIsModalOpen(true)}
          isDisabled={isDisabled}
        />
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
          }
        }}
      >
        <Suspense fallback={"loading..."}>
          <GenerateReportPopup
            onClose={() => setIsModalOpen(false)}
            onReportGenerated={onReportGenerated}
          />
        </Suspense>
      </Dialog>
    </>
  );
};

export default GenerateReport;
