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
    emptyData
  } from "./styles";
  import singleTheme from '../../../themes/v1SingleTheme';
  
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
    const [rowsPerPage, setRowsPerPage] = useState(10);

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
        setRowsPerPage(parseInt(event.target.value, 10));
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
                            <TableCell
                              sx={{ 
                                paddingX: theme.spacing(2),
                                fontSize: 12,
                                opacity: 0.7 }}
                            >
                              Showing {getRange} of {rows.length} evaluation{rows.length !== 1 ? "s" : ""}
                            </TableCell>
                            <TablePagination
                              count={rows.length}
                              page={page}
                              onPageChange={handleChangePage}
                              rowsPerPage={rowsPerPage}
                              rowsPerPageOptions={[5, 10, 15, 25]}
                              onRowsPerPageChange={handleChangeRowsPerPage}
                              ActionsComponent={(props) => (
                                <TablePaginationActions {...props} />
                              )}
                              labelRowsPerPage="Rows per page"
                              labelDisplayedRows={({ page, count }) =>
                                `Page ${page + 1} of ${Math.max(
                                  0,
                                  Math.ceil(count / rowsPerPage)
                                )}`
                              }
                              sx={{
                                "& .MuiTablePagination-select": {
                                  borderRadius: theme.shape.borderRadius,
                                  border: `1px solid ${theme.palette.border.light}`,
                                  padding: theme.spacing(1),
                                  minWidth: theme.spacing(8),
                                },
                                "& .MuiSelect-icon": {
                                  width: "24px",
                                  height: "fit-content",
                                },
                              }}
                              slotProps={{
                                select: {
                                  MenuProps: {
                                    keepMounted: true,
                                    PaperProps: {
                                      className: "pagination-dropdown",
                                      sx: {
                                        mt: 0,
                                        mb: theme.spacing(2),
                                      },
                                    },
                                    transformOrigin: {
                                      vertical: "bottom",
                                      horizontal: "left",
                                    },
                                    anchorOrigin: {
                                      vertical: "top",
                                      horizontal: "left",
                                    },
                                    sx: { mt: theme.spacing(-2) },
                                  },
                                  inputProps: { id: "pagination-dropdown" },
                                  IconComponent: SelectorVertical,
                                  sx: {
                                    ml: theme.spacing(4),
                                    mr: theme.spacing(12),
                                    minWidth: theme.spacing(20),
                                    textAlign: "left",
                                    border: "none",
                                    "&.Mui-focused > div": {
                                      backgroundColor: theme.palette.background.main,
                                    },
                                  },
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