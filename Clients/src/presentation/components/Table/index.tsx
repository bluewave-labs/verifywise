import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import TablePaginationActions from "../TablePagination";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import singleTheme from "../../themes/v1SingleTheme";
import { RISK_LABELS } from "../../components/RiskLevel/constants";
import { getAllEntities } from "../../../application/repository/entity.repository";

const DEFAULT_ROWS_PER_PAGE = 5;

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
}

interface DashboardValues {
  vendors: any[];
  users: any[];
}

const VWBasicTable = ({
  data,
  paginated = false,
  table,
  onRowClick,
  label,
  setSelectedRow,
  setAnchorEl,
}: TableProps) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const { setInputValues, dashboardValues, setDashboardValues } =
    useContext(VerifyWiseContext);

  useEffect(() => setPage(0), [data]);

  const handleChangePage = useCallback(
    (_: unknown, newPage: number) => setPage(newPage),
    []
  );
  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    []
  );

  const fetchVendors = useCallback(async () => {
    try {
      const response = await getAllEntities({ routeUrl: "/vendors" });
      setDashboardValues((prev: DashboardValues) => ({
        ...prev,
        vendors: response.data,
      }));
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  }, [setDashboardValues]);

  useEffect(() => {
    if (label !== "Project risk") fetchVendors();
  }, [label, fetchVendors]);

  const onRowClickHandler = (
    event: React.MouseEvent<HTMLTableRowElement>,
    rowData: any
  ) => {
    setSelectedRow(rowData);
    setInputValues(rowData);
    setAnchorEl(event.currentTarget);
    onRowClick?.(rowData.id);
  };

  const riskLevelChecker = (score: string) => {
    const parsedScore = parseInt(score, 10);
    if (!isNaN(parsedScore)) {
      if (parsedScore <= 3) return RISK_LABELS.low.text;
      if (parsedScore <= 6) return RISK_LABELS.medium.text;
      if (parsedScore <= 9) return RISK_LABELS.high.text;
      return RISK_LABELS.critical.text;
    }
    return score;
  };

  return (
    <>
      <TableContainer id={table}>
        <Table sx={singleTheme.tableStyles.primary.frame}>
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
          <TableBody>
            {data.rows?.map((row) => (
              <TableRow
                key={row.id}
                sx={{
                  ...singleTheme.tableStyles.primary.body.row,
                  height: "36px",
                  "&:hover": { backgroundColor: "#FBFBFB", cursor: "pointer" },
                }}
                onClick={(event) => onRowClickHandler(event, row)}
              >
                <TableCell>
                  {row.risk_name?.length > 30
                    ? `${row.risk_name.slice(0, 30)}...`
                    : row.risk_name}
                </TableCell>
                <TableCell>
                  {row.impact?.length > 30
                    ? `${row.impact.slice(0, 30)}...`
                    : row.impact}
                </TableCell>
                <TableCell>
                  {dashboardValues.users.find(
                    (user: any) => user.id === parseInt(row.risk_owner)
                  )?.name || row.risk_owner}
                </TableCell>
                <TableCell>
                  {riskLevelChecker(row.risk_level_autocalculated)}
                </TableCell>
                <TableCell>{row.likelihood}</TableCell>
                <TableCell>{row.risk_level_autocalculated}</TableCell>
                <TableCell>{row.mitigation_status}</TableCell>
                <TableCell>{row.final_risk_level}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {paginated && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          px={theme.spacing(4)}
          sx={{
            width: "100%",
            display: "flex",
          }}
        >
          <Typography px={theme.spacing(2)} fontSize={12} sx={{ opacity: 0.7 }}>
            Showing {page * rowsPerPage + 1} -{" "}
            {Math.min(page * rowsPerPage + rowsPerPage, data.rows.length)} of{" "}
            {data.rows.length} items
          </Typography>
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
            sx={{ mt: theme.spacing(6) }}
          />
        </Stack>
      )}
    </>
  );
};

export default VWBasicTable;
