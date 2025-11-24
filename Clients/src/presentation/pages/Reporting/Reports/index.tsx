import React, { useState, lazy, Suspense, useEffect, useCallback } from "react";
import { Stack, Box, Typography } from "@mui/material";
const ReportTable = lazy(() => import("../../../components/Table/ReportTable"));
import { TITLE_OF_COLUMNS } from "./constants";
import useGeneratedReports from "../../../../application/hooks/useGeneratedReports";
import { GeneratedReports } from "../../../../domain/interfaces/iReports";
import { styles, reportTablePlaceholder } from "./styles";
import { deleteEntityById } from "../../../../application/repository/entity.repository";
import { handleAlert } from "../../../../application/tools/alertUtils";
import Alert from "../../../components/Alert";
import Select from "../../../components/Inputs/Select";
import { useProjects } from "../../../../application/hooks/useProjects";
import CustomizableSkeleton from "../../../components/Skeletons";
import { Project } from "../../../../domain/types/Project";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../../application/hooks/useAuth";
import { GetMyOrganization } from "../../../../application/repository/organization.repository";

interface ReportsProps {
  refreshKey?: number;
  generateReportButton?: React.ReactNode;
}

const Reports: React.FC<ReportsProps> = ({
  refreshKey: externalRefreshKey = 0,
  generateReportButton,
}) => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "1";
  const [currentPage, setCurrentPage] = useState(0);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  const [selectedProject, setSelectedProject] = useState<
    string | number | null
  >("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use external refresh key when provided, otherwise use internal one
  const effectiveRefreshKey = externalRefreshKey || internalRefreshKey;

  // Handle external refresh with smooth transition
  useEffect(() => {
    if (externalRefreshKey > 0) {
      setIsRefreshing(true);
      // Brief delay to show the refresh effect
      const timer = setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [externalRefreshKey]);

  const { data: projects = [], isLoading: loadingProjects } = useProjects();

  const { generatedReports, loadingReports } = useGeneratedReports({
    projectId,
    projects,
    refreshKey: effectiveRefreshKey,
  });


  const { organizationId } = useAuth();
  const [organizationName, setOrganizationName] = useState("");

  const fetchOrganization = useCallback(async () => {
    try {
      const organizations = await GetMyOrganization({
        routeUrl: `/organizations/${organizationId}`,
      });
      const org = organizations.data.data;
      setOrganizationName(org.name || "");
    } catch (error) {
      console.error("Error fetching organization:", error);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  const [filteredReports, setFilteredReports] =
    useState<GeneratedReports[]>(generatedReports);

  // Function to transform project title based on framework_id
  const transformProjectTitle = (report: GeneratedReports): GeneratedReports => {
    const project = projects.find(p => p.id.toString() === report.project_id?.toString());
    if (project && project.framework.some(f => f.framework_id !== 1)) {
      return {
        ...report,
        project_title: organizationName,
      };
    }
    return report;
  };

  const handleToast = (type: any, message: string) => {
    handleAlert({
      variant: type,
      body: message,
      setAlert,
    });
    setTimeout(() => {
      setAlert(null);
    }, 3000);
  };

  const handleRemoveReport = async (id: number) => {
    try {
      const response = await deleteEntityById({
        routeUrl: `/reporting/${id}`,
      });
      if (response.status === 200) {
        handleToast("success", "Report deleted successfully.");
        setInternalRefreshKey((prevKey: number) => prevKey + 1);
        setFilteredReports((prevReports) =>
          prevReports.filter((report) => report.id !== id)
        );
      } else if (response.status === 204) {
        handleToast("error", "Report not found.");
      } else {
        handleToast("error", "Unexpected error occurs. Report delete fails.");
      }
    } catch (error) {
      console.error("Error sending request", error);
      handleToast("error", "Report delete fails.");
    }
  };

  const setCurrentPagingation = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const filterReports =
      selectedProject === "all"
        ? generatedReports
        : selectedProject === "org"
        ? generatedReports.filter((report) => {
            const project = projects.find(p => p.id.toString() === report.project_id?.toString());
            return project && project.framework.some(f => f.framework_id !== 1);
          })
        : generatedReports.filter(
            (report) => String(report?.project_id) === String(selectedProject)
          );
    setFilteredReports(filterReports);
  }, [selectedProject, generatedReports, projects]);

  return (
    <Stack
      sx={{
        ...styles.tableContainer,
        opacity: isRefreshing ? 0.7 : 1,
        padding: 0,
        margin: 0,
      }}
    >
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

      {loadingProjects || loadingReports ? (
        <>
          <Typography>Loading projects...</Typography>
          <CustomizableSkeleton
            variant="rectangular"
            sx={reportTablePlaceholder}
          />
        </>
      ) : (
        <>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-end"
            sx={{ marginBottom: "16px", marginTop: "0px !important" }}
          >
            <span data-joyride-id="report-filter">
              <Select
                id="project-filter"
                label="Filter by project"
                value={selectedProject || "all"}
                items={[
                  { _id: "all", name: "All" },
                  // Add organization entry if any project has framework_id !== 1
                  ...(projects.some(project => project.framework.some(f => f.framework_id !== 1))
                    ? [{ _id: "org", name: organizationName }]
                    : []),
                  // Add individual projects that don't have framework_id !== 1
                  ...projects
                    .filter(project => !project.framework.some(f => f.framework_id !== 1))
                    .map((project: Project) => ({
                      _id: project.id.toString(),
                      name: project.project_title,
                    }))
                ]}
                onChange={(e) => setSelectedProject(e.target.value)}
                sx={{ minWidth: 200, maxWidth: 300 }}
              />
            </span>
            {generateReportButton}
          </Stack>
          <Suspense fallback={<div>Loading...</div>}>
            <ReportTable
              columns={TITLE_OF_COLUMNS}
              rows={filteredReports.map(transformProjectTitle)}
              removeReport={handleRemoveReport}
              setCurrentPagingation={setCurrentPagingation}
              page={currentPage}
            />
          </Suspense>
        </>
      )}
    </Stack>
  );
};

export default Reports;
