import { useState, useContext } from 'react'
import { Stack } from '@mui/material';
import ReportTable from '../../../components/Table/ReportTable';
import { VerifyWiseContext } from '../../../../application/contexts/VerifyWise.context';
import { DEMO_DATA, TITLE_OF_COLUMNS } from './instants';
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
      <ReportTable
        columns={TITLE_OF_COLUMNS}
        rows={generatedReports}
        removeReport={handleRemoveReport}
        setPage={setCurrentPagingation}
        page={currentPage}
      />
    </Stack>
  )
}

export default Reports