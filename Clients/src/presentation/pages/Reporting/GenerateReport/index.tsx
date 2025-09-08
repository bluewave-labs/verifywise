import { lazy, Suspense, useState } from "react";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import { Stack, Dialog } from "@mui/material";
const GenerateReportPopup = lazy(
  () => import("../../../components/Reporting/GenerateReport")
);
const ReportStatus = lazy(() => import("./ReportStatus"));
import { styles } from "./styles";
import { useProjects } from "../../../../application/hooks/useProjects";

interface GenerateReportProps {
  onReportGenerated?: () => void;
}

const GenerateReport: React.FC<GenerateReportProps> = ({
  onReportGenerated,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { data: projects } = useProjects();
  const isDisabled = projects?.length && projects?.length > 0 ? false : true;

  return (
    <>
      <Stack sx={styles.container}>
        <CustomizableButton
          sx={{
            ...styles.buttonStyle,
            border: isDisabled ? "1px solid #dddddd" : "1px solid #13715B",
          }}
          variant="contained"
          text="Generate your report"
          onClick={() => setIsModalOpen(true)}
          isDisabled={isDisabled}
        />
        {/* Render generate report status */}
        <Suspense fallback={"loading..."}>
          <ReportStatus isDisabled={isDisabled} />
        </Suspense>
      </Stack>
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
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
