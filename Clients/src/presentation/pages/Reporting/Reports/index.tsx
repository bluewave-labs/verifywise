import { useState, useContext, lazy, Suspense } from 'react'
import { Stack } from '@mui/material';
const ReportTable = lazy(() => import('../../../components/Table/ReportTable'));
import { VerifyWiseContext } from '../../../../application/contexts/VerifyWise.context';
import { TITLE_OF_COLUMNS } from './constants';
import useGeneratedReports from '../../../../application/hooks/useGeneratedReports';
import {styles} from './styles';

const Reports = () => {
  const { dashboardValues } = useContext(VerifyWiseContext);
  const { selectedProjectId} = dashboardValues;
  const projectId = selectedProjectId;
  const [currentPage, setCurrentPage] = useState(0);

  const {
    generatedReports
  } = useGeneratedReports({ projectId });

  const handleRemoveReport = () => {
    // function for remove report 
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