import React, { useState, useCallback, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  useTheme,
  Stack,
  Typography,
  TableFooter,
} from "@mui/material";
import TablePaginationActions from "../../components/TablePagination";
import "../../components/Table/index.css";
import singleTheme from "../../themes/v1SingleTheme";
import CustomIconButton from "../../components/IconButton";
import allowedRoles from "../../../application/constants/permissions";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import { useContext } from "react";
import { ReactComponent as SelectorVertical } from "../../assets/icons/selector-vertical.svg";
import Placeholder from "../../assets/imgs/empty-state.svg";

//const Alert = lazy(() => import("../../../components/Alert"));

//Constant for table
const TABLE_COLUMNS = [
  { id: "training_name", label: "TRAINING NAME" },
  { id: "duration", label: "DURATION" },
  { id: "provider", label: "PROVIDER" },
  { id: "department", label: "DEPARTMENT" },
  { id: "status", label: "STATUS" },
  { id: "people", label: "PEOPLE" },
  { id: "actions", label: "" },
];

export interface IAITraining {
  id: number;
  training_name: string;
  duration: string;
  provider: string;
  department: string;
  status: "Planned" | "In Progress" | "Completed";
  people: number;
  description: string;
}

interface TrainingTableProps {
  data: IAITraining[];
  isLoading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  paginated?: boolean;
}

const DEFAULT_ROWS_PER_PAGE = 5;

const StatusBadge: React.FC<{ status: IAITraining["status"] }> = ({
  status,
}) => {
  const statusStyles = {
    Planned: { bg: "#bbdefb", color: "#1976d2" },
    "In Progress": { bg: "#fff9c4", color: "#fbc02d" },
    Completed: { bg: "#c8e6c9", color: "#388e3c" },
  };

  const style = statusStyles[status] || { bg: "#e0e0e0", color: "#424242" };

  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: "4px 8px",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: "0.75rem",
        textTransform: "uppercase",
        display: "inline-block",
      }}
    >
      {status}
    </span>
  );
};

const TrainingTable: React.FC<TrainingTableProps> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  paginated = true,
}) => {
  const theme = useTheme();
  const { userRoleName } = useContext(VerifyWiseContext);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const isDeletingAllowed =
    allowedRoles.training?.delete?.includes(userRoleName);

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

  const getRange = useMemo(() => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage + rowsPerPage, data?.length ?? 0);
    return `${start} - ${end}`;
  }, [page, rowsPerPage, data?.length]);

  const tableHeader = useMemo(
    () => (
      <TableHead
        sx={{
          backgroundColor:
            singleTheme.tableStyles.primary.header.backgroundColors,
        }}
      >
        <TableRow sx={singleTheme.tableStyles.primary.header.row}>
          {TABLE_COLUMNS.map((column) => (
            <TableCell
              key={column.id}
              sx={{
                ...singleTheme.tableStyles.primary.header.cell,
                ...(column.id === "actions" && {
                  position: "sticky",
                  right: 0,
                  zIndex: 10,
                  backgroundColor:
                    singleTheme.tableStyles.primary.header.backgroundColors,
                }),
              }}
            >
              {column.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    ),
    []
  );

  const tableBody = useMemo(
    () => (
      <TableBody>
        {data?.length > 0 ? (
          data
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((training) => (
              <TableRow
                key={training.id}
                sx={{
                  ...singleTheme.tableStyles.primary.body.row,
                  "&:hover": { backgroundColor: "#FBFBFB", cursor: "pointer" },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(training.id.toString());
                }}
              >
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {training.training_name}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {training.duration}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {training.provider}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {training.department}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  <StatusBadge status={training.status} />
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {training.people}
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    position: "sticky",
                    right: 0,
                    zIndex: 10,
                    minWidth: "50px",
                  }}
                >
                  {isDeletingAllowed && (
                    <CustomIconButton
                      id={training.id}
                      onDelete={() => onDelete?.(training.id.toString())}
                      onEdit={() => {
                        onEdit?.(training.id.toString());
                      }}
                      onMouseEvent={() => {}}
                      warningTitle="Delete this training?"
                      warningMessage="When you delete this training, all data related to this training will be removed. This action is non-recoverable."
                      type="Training"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={TABLE_COLUMNS.length}
              align="center"
              sx={{ py: 4 }}
            >
              No training data available.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    ),
    [data, page, rowsPerPage, isDeletingAllowed, onEdit, onDelete]
  );

  if (isLoading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          border: "1px solid #EEEEEE",
          borderRadius: "4px",
          padding: theme.spacing(15, 5),
          minHeight: 200,
        }}
      >
        <Typography>Loading...</Typography>
      </Stack>
    );
  }

  if (!data || data.length === 0) {
    return (
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
        <img src={Placeholder} alt="Placeholder" />
        <Typography sx={{ fontSize: "13px", color: "#475467" }}>
          There is currently no data in this table.
        </Typography>
      </Stack>
    );
  }

  return (
    <TableContainer sx={{ overflowX: "auto" }}>
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
                Showing {getRange} of {data?.length} training(s)
              </TableCell>
              <TablePagination
                count={data?.length ?? 0}
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
  );
};

export default TrainingTable;
