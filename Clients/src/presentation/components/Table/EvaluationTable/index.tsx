import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TablePagination,
    TableRow,
    Typography,
    useTheme,
    TableFooter,
    Box
  } from "@mui/material";
  import { Suspense, lazy, useMemo, useState, useCallback } from "react";
  import TablePaginationActions from "../../TablePagination";
  import TableHeader from "../TableHead";
  import placeholderImage from "../../../assets/imgs/empty-state.svg";
  import { ReactComponent as SelectorVertical } from "../../../assets/icons/selector-vertical.svg";
  import {
    emptyData,
    paginationStatus,
    paginationStyle,
    paginationDropdown,
    paginationSelect
  } from "./styles";
  import singleTheme from '../../../themes/v1SingleTheme';
  import { getPaginationRowCount, setPaginationRowCount } from '../../../../application/utils/paginationStorage';
  
  const EvaluationTableBody = lazy(() => import("./TableBody"));
  
  interface EvaluationRow {
    id: string;
    model: string;
    dataset: string;
    status: "In Progress" | "Completed" | "Failed" | "Pending" | "Running";
  }

  interface EvaluationTableProps {
    columns: string[];
    rows: EvaluationRow[];
    removeModel: {
        onConfirm: (id: string) => void;       // actually deletes
      };
    page: number;
    setCurrentPagingation: (pageNo: number) => void;
    onShowDetails: (model: EvaluationRow) => void;
  }
  
  const EvaluationTable: React.FC<EvaluationTableProps> = ({
    columns,
    rows,
    removeModel,
    page,
    setCurrentPagingation,
    onShowDetails
  }) => {
    const [rowsPerPage, setRowsPerPage] = useState(() => 
      getPaginationRowCount('evaluation', 10)
    );

    const theme = useTheme();
  
    const getRange = useMemo(() => {
      const start = page * rowsPerPage + 1;
      const end = Math.min(page * rowsPerPage + rowsPerPage, rows?.length ?? 0);
      return `${start} - ${end}`;
    }, [page, rowsPerPage, rows?.length]);
  
    const handleChangePage = useCallback((_: unknown, newPage: number) => {
      setCurrentPagingation(newPage);
    }, [setCurrentPagingation]);
  
    const handleChangeRowsPerPage = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setRowsPerPage(newRowsPerPage);
        setPaginationRowCount('evaluation', newRowsPerPage);
        setCurrentPagingation(0);
      },
      [setRowsPerPage, setCurrentPagingation]
    );
  
    return (
      <>
        <TableContainer sx ={{mt: 10}}>
            <Suspense fallback={<div>Loading...</div>}>
                <Table sx={{ ...singleTheme.tableStyles.primary.frame }}>
                    <TableHeader columns={columns} />
                    {rows.length !== 0 ? (
                    <>
                        <EvaluationTableBody
                            rows={rows}
                            onRemoveModel={removeModel}
                            onShowDetails={onShowDetails}
                            page={page}
                            rowsPerPage={rowsPerPage}
                        />    
                        <TableFooter>
                            <TableRow sx={{
                                    '& .MuiTableCell-root.MuiTableCell-footer': {
                                    paddingX: theme.spacing(8),
                                    paddingY: theme.spacing(4),
                                    }}}>
                            <TableCell sx={paginationStatus(theme)}>
                              Showing {getRange} of {rows?.length} evaluation{rows?.length !== 1 ? "s" : ""}
                            </TableCell>
                            <TablePagination
                              count={rows.length}
                              page={page}
                              onPageChange={handleChangePage}
                              rowsPerPage={rowsPerPage}
                              rowsPerPageOptions={[5, 10, 15, 20, 25]}
                              onRowsPerPageChange={handleChangeRowsPerPage}
                              ActionsComponent={(props) => <TablePaginationActions {...props} />}
                              labelRowsPerPage="Evaluations per page"
                              labelDisplayedRows={({ page, count }) =>
                                `Page ${page + 1} of ${Math.max(0, Math.ceil(count / rowsPerPage))}`
                              }
                              sx={paginationStyle(theme)}
                              slotProps={{
                                select: {
                                  MenuProps: {
                                    keepMounted: true,
                                    PaperProps: {
                                      className: "pagination-dropdown",
                                      sx: paginationDropdown(theme),
                                    },
                                    transformOrigin: { vertical: "bottom", horizontal: "left" },
                                    anchorOrigin: { vertical: "top", horizontal: "left" },
                                    sx: { mt: theme.spacing(-2) },
                                  },
                                  inputProps: { id: "pagination-dropdown" },
                                  IconComponent: SelectorVertical,
                                  sx: paginationSelect(theme),
                                },
                              }}
                            />
                            </TableRow>
                        </TableFooter>
                    </>
                    ) : (
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={columns.length} sx={emptyData}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                                        <img src={placeholderImage} alt="No data" style={{ width: '120px', height: '120px', marginBottom: '16px' }} />
                                        <Typography variant="h6" sx={{ color: '#6B7280', mb: 1 }}>
                                            No evaluations found
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#9CA3AF', textAlign: 'center' }}>
                                            Start by creating a new bias and fairness evaluation
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    )}
                </Table>
            </Suspense>
        </TableContainer>
      </>
    );
  };
  
  export default EvaluationTable;