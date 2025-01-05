import React, { useState, useCallback, useMemo } from "react";
import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  useTheme,
} from "@mui/material";
import singleTheme from "../themes/v1SingleTheme";
import TablePaginationActions from "../components/TablePagination";
import { ReactComponent as SelectorVertical } from "../assets/icons/selector-vertical.svg";

interface ITableCol {
  id: number;
  name: string;
}

const VWTable = ({
  id,
  cols,
  rows,
}: {
  id: any;
  cols: ITableCol[];
  rows: any[];
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

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

  const paginatedRows = useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page, rowsPerPage]
  );

  return (
    <Stack
      sx={{
        minWidth: 400,
        width: "100%",
        maxWidth: 1400,
      }}
    >
      <TableContainer
        id={id}
        className="vw-table-container"
        sx={singleTheme.tableStyles.primary.frame}
      >
        <Table className="vw-table">
          <TableHead
            className="vw-table-head"
            sx={{
              backgroundColors:
                singleTheme.tableStyles.primary.header.backgroundColors,
            }}
          >
            <TableRow className="vw-table-head">
              {cols.map((col, colIndex) => (
                <TableCell
                  key={colIndex}
                  className="vw-table-head-cell"
                  style={singleTheme.tableStyles.primary.header.cell}
                >
                  {col.name.toUpperCase()}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody className="vw-table-body">
            {paginatedRows.map((row: any, rowIndex: number) => (
              <TableRow key={rowIndex} className="vw-table-body-row">
                {cols.map((col) => (
                  <TableCell key={col.id}>
                    {row[col.name.toLowerCase()]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        count={rows.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 15, 20, 25]}
        onRowsPerPageChange={handleChangeRowsPerPage}
        ActionsComponent={(props) => <TablePaginationActions {...props} />}
        labelRowsPerPage="Rows per page"
        labelDisplayedRows={({ page, count }) =>
          `Page ${page + 1} of ${Math.max(0, Math.ceil(count / rowsPerPage))}`
        }
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
        sx={{
          border: "1px solid #EEEEEE",
          borderRadius: "4px",
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
    </Stack>
  );
};

export default VWTable;
