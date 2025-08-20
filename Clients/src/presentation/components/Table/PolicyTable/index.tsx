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
import { RISK_LABELS } from "../../RiskLevel/constants";
import { getAllEntities } from "../../../../application/repository/entity.repository";
import { ReactComponent as SelectorVertical } from "../../../assets/icons/selector-vertical.svg";


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
  renderRow?: (row: any) => React.ReactNode; // ✅ NEW
}

const CustomizablePolicyTable = ({
  data,
  paginated = false,
  onRowClick,
  label,
  setSelectedRow,
  setAnchorEl,
  renderRow,
}: TableProps) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const { setInputValues, dashboardValues, setDashboardValues } = useContext(VerifyWiseContext);
  const cellStyle = singleTheme.tableStyles.primary.body.cell;


  useEffect(() => setPage(0), [data.rows.length]);

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
      setDashboardValues((prev: any) => ({
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

  const tableHeader = (
    <TableHead sx={{ backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors }}>
      <TableRow sx={singleTheme.tableStyles.primary.header.row}>
        {data.cols.map((col) => (
          <TableCell key={col.id} style={singleTheme.tableStyles.primary.header.cell}>
            {col.name}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );

const tableBody = (
  <TableBody>
    {data.rows?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
      renderRow ? (
        renderRow(row)
      ) : (
        <TableRow
          key={row.id}
          sx={{
            ...singleTheme.tableStyles.primary.body.row,
            height: "36px",
            // "&:hover": {
            //   backgroundColor: "#FBFBFB",
            //   cursor: "pointer",
            // },
          }}
          onClick={(event) => onRowClickHandler(event, row)}
        >
          <TableCell sx={cellStyle}>
            {row.risk_name?.length > 30 ? `${row.risk_name.slice(0, 30)}...` : row.risk_name}
          </TableCell>
          <TableCell sx={cellStyle}>
            {row.impact?.length > 30 ? `${row.impact.slice(0, 30)}...` : row.impact}
          </TableCell>
          <TableCell sx={cellStyle}>
            {dashboardValues.users.find((user: any) => user.id === parseInt(row.risk_owner))?.name || row.risk_owner}
          </TableCell>
          <TableCell sx={cellStyle}>
            {riskLevelChecker(row.risk_level_autocalculated)}
          </TableCell>
          <TableCell sx={cellStyle}>{row.likelihood}</TableCell>
          <TableCell sx={cellStyle}>{row.risk_level_autocalculated}</TableCell>
          <TableCell sx={cellStyle}>{row.mitigation_status}</TableCell>
          <TableCell sx={cellStyle}>{row.final_risk_level}</TableCell>
        </TableRow>
      )
    ))}
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
          {/* <img src={Placeholder} alt="Placeholder" /> */}
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
      Showing {page * rowsPerPage + 1} - {Math.min(page * rowsPerPage + rowsPerPage, data.rows.length)} of {data.rows.length} items
    </TableCell>
    <TablePagination
      count={data.rows.length}
      page={page}
      onPageChange={handleChangePage}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={[5, 10, 15, 25]}
      onRowsPerPageChange={handleChangeRowsPerPage}
      ActionsComponent={TablePaginationActions as React.ComponentType<any>}
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