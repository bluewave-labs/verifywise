import {useState, useMemo, useCallback, lazy, Suspense} from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  Typography,
  useTheme,
  TableFooter
} from "@mui/material";
import singleTheme from '../../../themes/v1SingleTheme';
import placeholderImage from "../../../assets/imgs/empty-state.svg";
import { ReactComponent as SelectorVertical } from '../../../assets/icons/selector-vertical.svg'
import TablePaginationActions from '../../TablePagination';
import TableHeader from '../TableHead';
const ReportTableBody = lazy(() => import("./TableBody"))
import {styles, tableWrapper, emptyData, pagniationStatus, paginationStyle, paginationDropdown, paginationSelect} from './styles'

interface ReportTableProps {
  columns: any[];
  rows: any[];
  removeReport: (id: number) => void;
  page: number,
  setCurrentPagingation: (pageNo: number) => void;
}

const ReportTable: React.FC<ReportTableProps> = ({
    columns,
    rows,
    removeReport,
    page,
    setCurrentPagingation
  }) => {
  const theme = useTheme();
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const getRange = useMemo(() => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage + rowsPerPage, rows?.length ?? 0);
    return `${start} - ${end}`;
  }, [page, rowsPerPage, rows?.length ?? 0]);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setCurrentPagingation(newPage);
  }, [setCurrentPagingation]);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setCurrentPagingation(0);
    },
    [setRowsPerPage, setCurrentPagingation]
  );

  return (
    <>
      <TableContainer>
        <Suspense fallback={<div>Loading...</div>}>
          <Table
            sx={{
              ...singleTheme.tableStyles.primary.frame,
              ...tableWrapper
            }}
          >
            <TableHeader columns={columns} />
            {rows.length !== 0 ? 
              <>
                <ReportTableBody 
                  rows={rows} 
                  onRemoveReport={removeReport}
                  page={page}
                  rowsPerPage={rowsPerPage} 
                /> 
                <TableFooter>
                  <TableRow sx={{
                    '& .MuiTableCell-root.MuiTableCell-footer': {
                      paddingX: theme.spacing(8),
                      paddingY: theme.spacing(4),
                    }}}>
                    <TableCell sx={pagniationStatus}>
                      Showing {getRange} of {rows?.length} project report(s)
                    </TableCell>
                    <TablePagination
                      count={rows?.length}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      rowsPerPageOptions={[5, 10, 15, 20, 25]}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      ActionsComponent={(props) => <TablePaginationActions {...props} />}
                      labelRowsPerPage="Reports per page"
                      labelDisplayedRows={({ page, count }) =>
                        `Page ${page + 1} of ${Math.max(0, Math.ceil(count / rowsPerPage))}`
                      }
                      sx={paginationStyle}
                      slotProps={{
                        select: {
                          MenuProps: {
                            keepMounted: true,
                            PaperProps: {
                              className: "pagination-dropdown",
                              sx: paginationDropdown,
                            },
                            transformOrigin: { vertical: "bottom", horizontal: "left" },
                            anchorOrigin: { vertical: "top", horizontal: "left" },
                            sx: { mt: theme.spacing(-2) },
                          },
                          inputProps: { id: "pagination-dropdown" },
                          IconComponent: SelectorVertical,
                          sx: paginationSelect,
                        },
                      }}
                    />
                  </TableRow>
                </TableFooter>
              </>
            : (
              <>
                <TableBody>
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      align="center"
                      sx={emptyData}
                    >
                      <img src={placeholderImage} alt="Placeholder" />
                      <Typography sx={styles.textBase}>
                        There is currently no data in this table.
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </>
            )}
          </Table>
        </Suspense>
      </TableContainer>
    </>
  )
}

export default ReportTable