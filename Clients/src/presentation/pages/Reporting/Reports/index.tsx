import { useState, useContext, lazy, Suspense } from 'react'
import { Stack } from '@mui/material';
const ReportTable = lazy(() => import('../../../components/Table/ReportTable'));
import { VerifyWiseContext } from '../../../../application/contexts/VerifyWise.context';
import { TITLE_OF_COLUMNS } from './constants';
import useGeneratedReports from '../../../../application/hooks/useGeneratedReports';
import {styles} from './styles';
import { deleteEntityById } from '../../../../application/repository/entity.repository';

const Reports = () => {
  const { dashboardValues } = useContext(VerifyWiseContext);
  const { selectedProjectId} = dashboardValues;
  const projectId = selectedProjectId;
  const [currentPage, setCurrentPage] = useState(0);

  const {
    generatedReports
  } = useGeneratedReports({ projectId });

  const handleRemoveReport = async (id: number) => {
    // function for remove report 
    console.log('id:', id)
    try {
      const response = await deleteEntityById({
        routeUrl: `/reporting/${id}`,
      });
      if (response.status === 200) {
        console.log("success", "Report deleted successfully.");
      } else if (response.status === 404) {
        console.log("error", "Report not found.");
      } else {
        console.log("error", "Unexpected error occurs. Report delete fails.");
      }
    } catch (error) {
      console.error("Error sending request", error);
    }
  }

  const setCurrentPagingation = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <Stack sx={styles.tableContainer}>
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