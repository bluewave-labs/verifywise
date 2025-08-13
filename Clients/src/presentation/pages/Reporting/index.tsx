import { Suspense, lazy, useState } from "react";
import { Stack, Box } from "@mui/material";
const GenerateReport = lazy(() => import("./GenerateReport"));
const ReportLists = lazy(() => import("./Reports"));
const ReportingHeader = lazy(
  () => import("../../components/Reporting/ReportOverviewHeader"),
);
import { styles } from "./styles";
import HelperDrawer from "../../components/Drawer/HelperDrawer";
import reportingHelpContent from "../../../presentation/helpers/reporting-help.html?raw";

const Reporting = () => {
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  return (
    <Stack className="vwhome" gap={"20px"}>
      <HelperDrawer
        isOpen={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        helpContent={reportingHelpContent}
        pageTitle="Reporting Dashboard"
      />

      <Suspense fallback={"loading..."}>
        <ReportingHeader
          titlesx={styles.vwHeadingTitle}
          subsx={styles.vwSubHeadingTitle}
        />
      </Suspense>

      <Stack>
        <Box sx={styles.reportButtonContainer}>
          <Suspense fallback={"loading..."}>
            <GenerateReport />
          </Suspense>
        </Box>

        <Suspense fallback={"loading..."}>
          <ReportLists />
        </Suspense>
      </Stack>
    </Stack>
  );
};

export default Reporting;
