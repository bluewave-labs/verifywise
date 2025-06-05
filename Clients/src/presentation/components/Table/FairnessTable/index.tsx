import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TablePagination,
    TableRow,
    Typography,
    Box,
    IconButton
  } from "@mui/material";
  import { Suspense, lazy, useMemo, useState, useCallback } from "react";
  import TablePaginationActions from "../../TablePagination";
  import TableHeader from "../TableHead";
  import placeholderImage from "../../../assets/imgs/empty-state.svg";
  import { ReactComponent as SelectorVertical } from '../../../assets/icons/selector-vertical.svg';
  import {
    styles,
    emptyData,
    paginationWrapper,
    pagniationStatus,
    paginationStyle,
    paginationDropdown,
    paginationSelect
  } from "./styles";
  import singleTheme from '../../../themes/v1SingleTheme';
  
  const FairnessTableBody = lazy(() => import("./TableBody"));
  
  interface FairnessTableProps {
    columns: any[];
    rows: any[];
    removeModel: (id: number) => void;
    page: number;
    setCurrentPagingation: (pageNo: number) => void;
    onShowDetails: (model: any) => void;
  }
  
  const FairnessTable: React.FC<FairnessTableProps> = ({
    columns,
    rows,
    removeModel,
    page,
    setCurrentPagingation,
    onShowDetails
  }) => {
    const [rowsPerPage, setRowsPerPage] = useState(5);
  
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
          <Table sx={{ ...singleTheme.tableStyles.primary.frame }}>
            <TableHeader columns={columns} />
            {rows.length !== 0 ? (
                <Suspense
                    fallback={
                    <TableBody>
                        <TableRow sx={singleTheme.tableStyles.primary.body.row}>
                        <TableCell
                            colSpan={columns.length}
                            align="center"
                            sx={singleTheme.tableStyles.primary.body.cell}
                        >
                            Loading...
                        </TableCell>
                        </TableRow>
                    </TableBody>
                    }
                >
                    <FairnessTableBody
                        rows={rows}
                        onRemoveModel={removeModel}
                        onShowDetails={onShowDetails}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        //columns={columns}
                    />    
                    
                </Suspense>
             
            ) : (
              <TableBody>
                <TableRow sx={singleTheme.tableStyles.primary.body.row}>
                  <TableCell
                    colSpan={columns.length}
                    align="center"
                    sx={singleTheme.tableStyles.primary.body.cell}
                  >
                    <img src={placeholderImage} alt="Placeholder" />
                    <Typography sx={{ ...styles.textBase, color: 'text.primary' }}>
                      There is currently no data in this table.
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
        </TableContainer>

  
        {rows.length !== 0 && (
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={paginationWrapper} mt={2}>
            <Typography sx={pagniationStatus} color="text.secondary">
              Showing {getRange} of {rows.length} fairness checks
            </Typography>
            <TablePagination
              count={rows.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[5, 10, 15, 20]}
              onRowsPerPageChange={handleChangeRowsPerPage}
              ActionsComponent={(props) => <TablePaginationActions {...props} />}
              labelRowsPerPage="Fairness checks per page"
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
                    sx: { mt: 0 },
                  },
                  inputProps: { id: "pagination-dropdown" },
                  IconComponent: SelectorVertical,
                  sx: paginationSelect,
                },
              }}
            />
          </Box>
        )}
      </>
    );
  };
  
  export default FairnessTable;
  