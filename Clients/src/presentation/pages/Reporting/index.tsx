import { Suspense, lazy, useState, useCallback } from "react";
import { Stack } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
const GenerateReport = lazy(() => import("./GenerateReport"));
const ReportLists = lazy(() => import("./Reports"));
const ReportingHeader = lazy(
  () => import("../../components/Reporting/ReportOverviewHeader")
);
import HelperDrawer from "../../components/HelperDrawer";

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
        open={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(false)}
        title="Reporting & analytics"
        description="Generate comprehensive governance reports and compliance documentation"
        whatItDoes="Create **automated reports** for *governance activities*, **compliance assessments**, and *audit documentation*. Generate **executive summaries**, *detailed compliance reports*, and **risk assessments** from your governance data."
        whyItMatters="**Reporting** is essential for demonstrating *compliance*, communicating **governance status** to stakeholders, and supporting *audit requirements*. **Well-structured reports** provide evidence of *due diligence* and **continuous improvement** in your AI governance program."
        quickActions={[
          {
            label: "Generate Report",
            description: "Create a new compliance or governance report",
            primary: true
          },
          {
            label: "View Reports",
            description: "Access previously generated reports and templates"
          }
        ]}
        useCases={[
          "**Quarterly compliance reports** for *board* and **regulatory submissions**",
          "**Audit documentation packages** with *evidence* and **control attestations**"
        ]}
        keyFeatures={[
          "**Automated report generation** from *governance data* with **customizable templates**",
          "**Multiple export formats** for different *stakeholder needs*",
          "**Historical report archive** for *trend analysis* and **audit trails**"
        ]}
        tips={[
          "**Schedule regular reports** to maintain *consistent stakeholder communication*",
          "Use **report templates** to ensure *consistency* across different reporting periods",
          "**Archive all generated reports** for *audit trail* and **historical reference**"
        ]}
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
