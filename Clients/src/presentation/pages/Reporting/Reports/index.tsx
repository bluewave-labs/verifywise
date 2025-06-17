import { useState, useContext, lazy, Suspense, useEffect } from 'react'
import { Stack, Box, Typography } from '@mui/material';
const ReportTable = lazy(() => import('../../../components/Table/ReportTable'));
import { VerifyWiseContext } from '../../../../application/contexts/VerifyWise.context';
import { TITLE_OF_COLUMNS } from './constants';
import useGeneratedReports, { GeneratedReports } from '../../../../application/hooks/useGeneratedReports';
import {styles, reportTablePlaceholder} from './styles';
import { deleteEntityById } from '../../../../application/repository/entity.repository';
import { handleAlert } from '../../../../application/tools/alertUtils';
import Alert from '../../../components/Alert';
import ProjectFilterDropdown from '../../../components/Inputs/Dropdowns/ProjectFilter/ProjectFilterDropdown';
import { useProjects } from '../../../../application/hooks/useProjects';
import CustomizableSkeleton from '../../../vw-v2-components/Skeletons';

const Reports = () => {
  const { dashboardValues } = useContext(VerifyWiseContext);
  const { selectedProjectId} = dashboardValues;
  const projectId = selectedProjectId;
  const [currentPage, setCurrentPage] = useState(0);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedProject, setSelectedProject] = useState<string | number | null>("all");
  
  const {
    projects,
    loading: loadingProjects,
  } = useProjects();

  const {
    generatedReports,
    loadingReports
  } = useGeneratedReports({ projectId, projects, refreshKey });

  const [filteredReports, setFilteredReports] = useState<GeneratedReports[]>(generatedReports);

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
        setRefreshKey((prevKey) => prevKey + 1);
      } else if (response.status === 204) {
        handleToast("error", "Report not found.");
      } else {
        handleToast("error", "Unexpected error occurs. Report delete fails.");
      }
    } catch (error) {
      console.error("Error sending request", error);
      handleToast("error", "Report delete fails.");
    }
  }

  const setCurrentPagingation = (page: number) => {
    setCurrentPage(page)
  }

  useEffect(() => {
    const filterReports = selectedProject === 'all' 
      ? generatedReports 
      : generatedReports.filter(
      (report) => String(report?.project_id) === String(selectedProject)
    );
    setFilteredReports(filterReports);
  }, [selectedProject, generatedReports]);

  return (
    <Stack sx={styles.tableContainer}>
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
          <ProjectFilterDropdown
            projects={projects.map((project) => ({
              id: project.id.toString(),
              name: project.project_title,
            }))}
            selectedProject={selectedProject}            
            onChange={setSelectedProject}
            sx={{marginBottom: '20px'}}
          />
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
  )
}

export default Reports