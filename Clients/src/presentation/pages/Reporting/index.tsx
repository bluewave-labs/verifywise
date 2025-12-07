import { Suspense, lazy, useState, useCallback } from "react";
import { Stack } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
const GenerateReport = lazy(() => import("./GenerateReport"));
const ReportLists = lazy(() => import("./Reports"));
const ReportingHeader = lazy(
  () => import("../../components/Reporting/ReportOverviewHeader")
);
import PageTour from "../../components/PageTour";
import ReportingSteps from "./ReportingSteps";
import TipBox from "../../components/TipBox";

const Reporting = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleReportGenerated = useCallback(() => {
    // Increment refresh key to trigger re-render of Reports component
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <Stack className="vwhome" gap={"24px"}>
    <PageBreadcrumbs />
      <Suspense fallback={"loading..."}>
        <ReportingHeader articlePath="reporting/generating-reports" />
      </Suspense>
      <TipBox entityName="reporting" />

      <Stack data-joyride-id="reports-list">
        <Suspense fallback={"loading..."}>
          <ReportLists
            refreshKey={refreshKey}
            generateReportButton={
              <div data-joyride-id="generate-report-button">
                <GenerateReport onReportGenerated={handleReportGenerated} />
              </div>
            }
          />
        </Suspense>
      </Stack>

      <PageTour steps={ReportingSteps} run={true} tourKey="reporting-tour" />
    </Stack>
  );
};

export default Reporting;
