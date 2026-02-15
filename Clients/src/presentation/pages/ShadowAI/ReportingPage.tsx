/**
 * Shadow AI Reporting Page
 *
 * Main page for the Shadow AI reporting tab.
 * Shows a list of generated reports with the ability to generate new ones.
 */

import { useState, useCallback } from "react";
import { Stack } from "@mui/material";
import PageHeader from "../../components/Layout/PageHeader";
import { CustomizableButton } from "../../components/button/customizable-button";
import { EmptyState } from "../../components/EmptyState";
import ShadowAIReportTable from "./components/ShadowAIReportTable";
import GenerateShadowAIReport from "./components/GenerateShadowAIReport";
import { useIsAdmin } from "../../../application/hooks/useIsAdmin";

export default function ReportingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasReports, setHasReports] = useState<boolean | null>(null);
  const isAdmin = useIsAdmin();

  const handleReportGenerated = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <Stack gap="16px">
      <PageHeader
        title="Reporting"
        description="Generate and download Shadow AI reports."
        rightContent={
          isAdmin ? (
            <CustomizableButton
              variant="contained"
              text="Generate report"
              onClick={() => setModalOpen(true)}
              sx={{
                height: "34px",
                backgroundColor: "#13715B",
                "&:hover": { backgroundColor: "#0F5A47" },
              }}
            />
          ) : undefined
        }
      />

      <ShadowAIReportTable
        refreshKey={refreshKey}
        onReportsLoaded={(count) => setHasReports(count > 0)}
      />

      {hasReports === false && (
        <EmptyState
          message="No reports have been generated yet."
          showBorder
        />
      )}

      <GenerateShadowAIReport
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onReportGenerated={handleReportGenerated}
      />
    </Stack>
  );
}
