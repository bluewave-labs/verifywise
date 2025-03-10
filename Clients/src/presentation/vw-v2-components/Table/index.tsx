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
import singleTheme from "../../themes/v1SingleTheme";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import TablePaginationActions from "../../components/TablePagination";
import { ReactComponent as SelectorVertical } from "../../assets/icons/selector-vertical.svg";
import { ProjectRisk } from "../../../domain/ProjectRisk";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import { RISK_LABELS } from "../../components/RiskLevel/constants";
import IconButton from "../../components/IconButton";

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

const VWProjectRisksTableHead = ({ columns }: { columns: any[] }) => {
  return (
    <TableHead
      sx={{
        backgroundColor:
          singleTheme.tableStyles.primary.header.backgroundColors,
      }}
    >
      <TableRow sx={singleTheme.tableStyles.primary.header.row}>
        {columns.map((column, index) => (
          <TableCell
            key={index}
            style={{
              ...singleTheme.tableStyles.primary.header.cell,
              ...(index === columns.length - 1
                ? {
                    position: "sticky",
                    right: 0,
                    backgroundColor:
                      singleTheme.tableStyles.primary.header.backgroundColors,
                  }
                : {}),
            }}
          >
            {column}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

const VWProjectRisksTableBody = ({
  rows,
  page,
  rowsPerPage,
  setSelectedRow,
  setAnchorEl,
  onDeleteRisk,
}: {
  rows: any[];
  page: number;
  rowsPerPage: number;
  setSelectedRow: any;
  setAnchorEl: any;
  onDeleteRisk: (id: number) => void
}) => {
  const { setInputValues, dashboardValues } = useContext(VerifyWiseContext);
  const cellStyle = singleTheme.tableStyles.primary.body.cell;  

  const handelEditRisk = (event: React.MouseEvent, row: any) => {    
    setSelectedRow(row);
    setInputValues(row);
    setAnchorEl(event.currentTarget);
  }

  const handleDeleteRisk = async(riskId: number) => {
    onDeleteRisk(riskId);
  }

  return (
    <TableBody>
      {rows &&
        rows
          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((row: ProjectRisk, index: number) => (
            <TableRow
              key={index}
              sx={singleTheme.tableStyles.primary.body.row}
            >
              <TableCell sx={cellStyle}>
                {row.risk_name?.length > 30
                  ? `${row.risk_name.slice(0, 30)}...`
                  : row.risk_name}
              </TableCell>
              <TableCell sx={cellStyle}>
                {row.impact?.length > 30
                  ? `${row.impact.slice(0, 30)}...`
                  : row.impact}
              </TableCell>
              <TableCell sx={cellStyle}>
                {dashboardValues.users.find(
                  (user: any) => user.id === parseInt(row.risk_owner)
                )?.name || row.risk_owner}
              </TableCell>
              <TableCell sx={cellStyle}>
                {riskLevelChecker(row.risk_level_autocalculated)}
              </TableCell>
              <TableCell sx={cellStyle}>{row.likelihood}</TableCell>
              <TableCell sx={cellStyle}>
                {row.risk_level_autocalculated}
              </TableCell>
              <TableCell sx={cellStyle}>{row.mitigation_status}</TableCell>
              <TableCell sx={cellStyle}>{row.final_risk_level}</TableCell>
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  position: "sticky",
                  right: 0,
                  minWidth: "50px",
                }}
              >
                <IconButton
                  id={row.id}
                  type="project"
                  onMouseEvent={(e) => handelEditRisk(e, row)}                  
                  onDelete={() => handleDeleteRisk(row.id)}
                ></IconButton>
              </TableCell>
            </TableRow>
          ))}
    </TableBody>
  );
};

const VWProjectRisksTable = ({
  columns,
  rows,
  setSelectedRow,
  setAnchorEl,
  deleteRisk,
  setPage,
  page,
}: {
  columns: any[];
  rows: any[];
  setSelectedRow: any;
  setAnchorEl: any;
  deleteRisk: (id: number) => void;
  setPage: (pageNo: number) => void;
  page: number;
}) => {
  const theme = useTheme();
  // const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

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
    <>
      <TableContainer>
        <Table
          sx={{
            ...singleTheme.tableStyles.primary.frame,
          }}
        >
          <VWProjectRisksTableHead columns={columns} />
          <VWProjectRisksTableBody
            rows={rows}
            page={page}
            rowsPerPage={rowsPerPage}
            setSelectedRow={setSelectedRow}
            setAnchorEl={setAnchorEl}
            onDeleteRisk={deleteRisk}
          />
        </Table>
      </TableContainer>
      <Stack
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingX: theme.spacing(4),
          "& p": {
            color: theme.palette.text.tertiary,
          },
        }}
      >
        <Typography
          sx={{
            paddingX: theme.spacing(2),
            fontSize: 12,
            opacity: 0.7,
          }}
        >
          Showing {getRange} of {rows?.length} project risk(s)
        </Typography>
        <TablePagination
          count={rows?.length}
          page={page}
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
      </Stack>
    </>
  );
};

export default VWProjectRisksTable;
