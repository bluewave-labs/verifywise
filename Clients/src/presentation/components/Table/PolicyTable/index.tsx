import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import TablePaginationActions from "../../TablePagination";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import singleTheme from "../../../themes/v1SingleTheme";
import { ChevronsUpDown as SelectorVertical } from "lucide-react";
import { getPaginationRowCount, setPaginationRowCount } from "../../../../application/utils/paginationStorage";

const DEFAULT_ROWS_PER_PAGE = 10;

interface TableProps {
  data: {
    rows: any[];
    cols: { id: string; name: string }[];
  };
  bodyData: any[];
  paginated?: boolean;
  reversed?: boolean;
  table: string;
  onRowClick?: (id: string) => void;
  label?: string;
  setSelectedRow: (row: any) => void;
  setAnchorEl: (element: HTMLElement | null) => void;
  renderRow?: (row: any) => React.ReactNode; // ✅ NEW
}

const CustomizablePolicyTable = ({
  data,
  paginated = false,
  onRowClick,
  setSelectedRow,
  setAnchorEl,
  renderRow,
}: TableProps) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => 
    getPaginationRowCount('policyManager', DEFAULT_ROWS_PER_PAGE)
  );
  const { setInputValues } =
    useContext(VerifyWiseContext);

  useEffect(() => setPage(0), [data.rows.length]);

  const handleChangePage = useCallback(
    (_: unknown, newPage: number) => setPage(newPage),
    []
  );
  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newRowsPerPage = parseInt(event.target.value, 10);
      setRowsPerPage(newRowsPerPage);
      setPaginationRowCount('policyManager', newRowsPerPage);
      setPage(0);
    },
    []
  );

  const onRowClickHandler = (
    event: React.MouseEvent<HTMLTableRowElement>,
    rowData: any
  ) => {
    setSelectedRow(rowData);
    setInputValues(rowData);
    setAnchorEl(event.currentTarget);
    onRowClick?.(rowData.id);
  };

  const tableHeader = (
    <TableHead
      sx={{
        backgroundColor:
          singleTheme.tableStyles.primary.header.backgroundColors,
      }}
    >
      <TableRow sx={singleTheme.tableStyles.primary.header.row}>
        {data.cols.map((col) => (
          <TableCell
            key={col.id}
            style={singleTheme.tableStyles.primary.header.cell}
          >
            {col.name}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );

  const tableBody = (
    <TableBody>
      {data.rows
        ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((row) =>
          renderRow ? (
            renderRow(row)
          ) : (
            <TableRow
              key={row.id}
              onClick={(event) => onRowClickHandler(event, row)}
            >
              {data.cols.map((col) => (
                <TableCell
                  key={col.id}
                  style={singleTheme.tableStyles.primary.body.cell}
                >
                  {row[col.id]}
                </TableCell>
              ))}
            </TableRow>
          )
        )}
    </TableBody>
  );

  return (
    <>
      {!data.rows.length ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            border: "1px solid #EEEEEE",
            borderRadius: "4px",
            padding: theme.spacing(15, 5),
            paddingBottom: theme.spacing(20),
            gap: theme.spacing(10),
            minHeight: 200,
          }}
        >
          <Typography sx={{ fontSize: "13px", color: "#475467" }}>
            There is currently no data in this table.
          </Typography>
        </Stack>
      ) : (
        <TableContainer>
          <Table sx={singleTheme.tableStyles.primary.frame}>
            {tableHeader}
            {tableBody}
            {paginated && (
              <TableFooter>
                <TableRow
                  sx={{
                    "& .MuiTableCell-root.MuiTableCell-footer": {
                      paddingX: theme.spacing(8),
                      paddingY: theme.spacing(4),
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      paddingX: theme.spacing(2),
                      fontSize: 12,
                      opacity: 0.7,
                    }}
                  >
                    Showing {page * rowsPerPage + 1} -{" "}
                    {Math.min(
                      page * rowsPerPage + rowsPerPage,
                      data.rows.length
                    )}{" "}
                    of {data.rows.length} items
                  </TableCell>
                  <TablePagination
                    count={data.rows.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[5, 10, 15, 25]}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    ActionsComponent={
                      TablePaginationActions as React.ComponentType<any>
                    }
                    labelRowsPerPage="Rows per page"
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
                        IconComponent: () => <SelectorVertical size={16} />,
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
                    sx={{
                      mt: theme.spacing(6),
                      color: theme.palette.text.secondary,
                      "& .MuiSelect-icon": {
                        width: "24px",
                        height: "fit-content",
                      },
                      "& .MuiSelect-select": {
                        width: theme.spacing(10),
                        borderRadius: theme.shape.borderRadius,
                        border: `1px solid ${theme.palette.border.light}`,
                        padding: theme.spacing(4),
                      },
                    }}
                  />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default CustomizablePolicyTable;
