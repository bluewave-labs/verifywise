import { lazy, Suspense, useContext, useState } from "react";
import CustomizableButton from "../../../vw-v2-components/Buttons";
import { Stack, Dialog } from "@mui/material";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
const GenerateReportPopup = lazy(
  () => import("../../../components/Reporting/GenerateReport")
);
const ReportStatus = lazy(() => import("./ReportStatus"));
import { styles } from "./styles";

const GenerateReport = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);  
  const { projects } = useContext(VerifyWiseContext);
  const isDisabled = projects.length > 0 ? false : true;

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
          <GenerateReportPopup onClose={() => setIsModalOpen(false)} />
        </Suspense>
      </Dialog>
    </>
  );
};

export default GenerateReport;
