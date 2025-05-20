import { useState, useContext, lazy, Suspense } from 'react'
import { Stack, Box } from '@mui/material';
const ReportTable = lazy(() => import('../../../components/Table/ReportTable'));
import { VerifyWiseContext } from '../../../../application/contexts/VerifyWise.context';
import { TITLE_OF_COLUMNS } from './constants';
import useGeneratedReports from '../../../../application/hooks/useGeneratedReports';
import {styles} from './styles';
import { deleteEntityById } from '../../../../application/repository/entity.repository';
import { handleAlert } from '../../../../application/tools/alertUtils';
import Alert from '../../../components/Alert';

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

  const {
    generatedReports
  } = useGeneratedReports({ projectId, refreshKey });

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
      <Suspense fallback={<div>Loading...</div>}>
        <ReportTable
          columns={TITLE_OF_COLUMNS}
          rows={generatedReports}
          removeReport={handleRemoveReport}
          setCurrentPagingation={setCurrentPagingation}
          page={currentPage}
        />
      </Suspense>
    </Stack>
  )
}

export default Reports