import { Suspense, lazy, useState, useCallback } from "react";
import { Stack } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
const GenerateReport = lazy(() => import("./GenerateReport"));
const ReportLists = lazy(() => import("./Reports"));
const ReportingHeader = lazy(
  () => import("../../components/Reporting/ReportOverviewHeader")
);
import HelperDrawer from "../../components/Drawer/HelperDrawer";
import reportingHelpContent from "../../../presentation/helpers/reporting-help.html?raw";

const Reporting = () => {
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleReportGenerated = useCallback(() => {
    // Increment refresh key to trigger re-render of Reports component
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <Stack className="vwhome" gap={"20px"}>
    <PageBreadcrumbs />
      <HelperDrawer
        isOpen={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        helpContent={reportingHelpContent}
        pageTitle="Reporting Dashboard"
      />

      <Suspense fallback={"loading..."}>
        <ReportingHeader
          onHelperClick={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        />
      </Suspense>

      <Stack>
        <Suspense fallback={"loading..."}>
          <ReportLists 
            refreshKey={refreshKey}
            generateReportButton={
              <GenerateReport onReportGenerated={handleReportGenerated} />
            }
          />
        </Suspense>
      </Stack>
    </Stack>
  );
};

export default Reporting;
