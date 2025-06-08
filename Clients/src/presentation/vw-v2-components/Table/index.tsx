import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer, 
  TablePagination,
  TableRow,
  TableFooter,
  Typography,
  useTheme,
} from "@mui/material";
import singleTheme from "../../themes/v1SingleTheme";
import { useCallback, useMemo, useState, useEffect } from "react";
import TablePaginationActions from "../../components/TablePagination";
import { ReactComponent as SelectorVertical } from "../../assets/icons/selector-vertical.svg";
import placeholderImage from "../../assets/imgs/empty-state.svg";
import VWProjectRisksTableHead from "./VWProjectRisksTableHead";
import VWProjectRisksTableBody from "./VWProjectRisksTableBody";


const VWProjectRisksTable = ({
  columns,
  rows,
  setSelectedRow,
  setAnchor,
  deleteRisk,
  setPage,
  page,
  flashRow,
}: {
  columns: any[];
  rows: any[];
  setSelectedRow: any;
  setAnchor: any;
  deleteRisk: (id: number) => void;
  setPage: (pageNo: number) => void;
  page: number;
  flashRow: number | null;
}) => {
  const theme = useTheme();
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Ensure page is valid when rows are empty
  const validPage = rows.length === 0 ? 0 : Math.min(page, Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1));

  // Update page if it's invalid
  useEffect(() => {
    if (page !== validPage) {
      setPage(validPage);
    }
  }, [rows.length, page, validPage, setPage]);

  const getRange = useMemo(() => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage + rowsPerPage, rows?.length ?? 0);
    return `${start} - ${end}`;
  }, [page, rowsPerPage, rows?.length ?? 0]);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    []
  );

  return (
    <TableContainer>
      <Table
        sx={{
          ...singleTheme.tableStyles.primary.frame,
        }}
      >
        <VWProjectRisksTableHead columns={columns} />
        {rows.length !== 0 ? (
          <VWProjectRisksTableBody
            rows={rows}
            page={page}
            rowsPerPage={rowsPerPage}
            setSelectedRow={setSelectedRow}
            setAnchor={setAnchor}
            onDeleteRisk={deleteRisk}
            flashRow={flashRow}
          />
        ) : (
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={columns.length}
                align="center"
                style={{
                  padding: theme.spacing(15, 5),
                  paddingBottom: theme.spacing(20),
                }}
              >
                <img src={placeholderImage} alt="Placeholder" />
                <Typography sx={{ fontSize: "13px", color: "#475467" }}>
                  There is currently no data in this table.
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        )}
        <TableFooter>
          <TableRow>
            <TableCell colSpan={columns.length} sx={{ border: 'none', p: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingX: theme.spacing(4),
                }}
              >
                <Typography
                  sx={{
                    paddingX: theme.spacing(2),
                    fontSize: 12,
                    opacity: 0.7,
                    color: theme.palette.text.tertiary,
                  }}
                >
                  Showing {getRange} of {rows?.length} project risk(s)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TablePagination
                    component="div"
                    count={rows?.length}
                    page={validPage}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[5, 10, 15, 20, 25]}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    ActionsComponent={(props) => <TablePaginationActions {...props} />}
                    labelRowsPerPage="Project risks per page"
                    labelDisplayedRows={({ page, count }) =>
                      `Page ${page + 1} of ${Math.max(0, Math.ceil(count / rowsPerPage))}`
                    }
                    sx={{
                      mt: theme.spacing(6),
                      color: theme.palette.text.secondary,
                      "& .MuiTablePagination-select": {
                        width: theme.spacing(10),
                        borderRadius: theme.shape.borderRadius,
                        border: `1px solid ${theme.palette.border.light}`,
                        padding: theme.spacing(4),
                      },
                      "& .MuiTablePagination-selectIcon": {
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
                          transformOrigin: { vertical: "bottom", horizontal: "left" },
                          anchorOrigin: { vertical: "top", horizontal: "left" },
                          sx: { mt: theme.spacing(-2) },
                        },
                        inputProps: { id: "pagination-dropdown" },
                        IconComponent: SelectorVertical,
                        sx: {
                          ml: theme.spacing(4),
                          mr: theme.spacing(12),
                          minWidth: theme.spacing(20),
                          textAlign: "left",
                          "&.Mui-focused > div": {
                            backgroundColor: theme.palette.background.main,
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </Box>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default VWProjectRisksTable;