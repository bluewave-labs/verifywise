import React, { useState, lazy, Suspense, useEffect } from "react";
import { Stack, Box, Typography } from "@mui/material";
const ReportTable = lazy(() => import("../../../components/Table/ReportTable"));
import { TITLE_OF_COLUMNS } from "./constants";
import useGeneratedReports, {
  GeneratedReports,
} from "../../../../application/hooks/useGeneratedReports";
import { styles, reportTablePlaceholder } from "./styles";
import { deleteEntityById } from "../../../../application/repository/entity.repository";
import { handleAlert } from "../../../../application/tools/alertUtils";
import Alert from "../../../components/Alert";
import ProjectFilterDropdown from "../../../components/Inputs/Dropdowns/ProjectFilter/ProjectFilterDropdown";
import { useProjects } from "../../../../application/hooks/useProjects";
import CustomizableSkeleton from "../../../components/Skeletons";
import { Project } from "../../../../domain/types/Project";
import { useSearchParams } from "react-router-dom";

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

  const [filteredReports, setFilteredReports] =
    useState<GeneratedReports[]>(generatedReports);

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
        : generatedReports.filter(
            (report) => String(report?.project_id) === String(selectedProject)
          );
    setFilteredReports(filterReports);
  }, [selectedProject, generatedReports]);

  return (
    <Stack
      sx={{
        ...styles.tableContainer,
        opacity: isRefreshing ? 0.7 : 1,
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
            alignItems="center"
            sx={{ marginBottom: "24px" }}
          >
            <ProjectFilterDropdown
              projects={projects.map((project: Project) => ({
                id: project.id.toString(),
                name: project.project_title,
              }))}
              selectedProject={selectedProject}
              onChange={setSelectedProject}
            />
            {generateReportButton}
          </Stack>
          <Suspense fallback={<div>Loading...</div>}>
            <ReportTable
              columns={TITLE_OF_COLUMNS}
              rows={filteredReports}
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
