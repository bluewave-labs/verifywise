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
  Chip,
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
import {
  IModelInventory,
  ModelInventoryStatus,
} from "../../../domain/interfaces/i.modelInventory";

// Constants for table
const TABLE_COLUMNS = [
  { id: "provider_model", label: "PROVIDER/MODEL" },
  { id: "version", label: "VERSION" },
  { id: "approver", label: "APPROVER" },
  { id: "capabilities", label: "CAPABILITIES" },
  { id: "security_assessment", label: "SECURITY ASSESSMENT" },
  { id: "status", label: "STATUS" },
  { id: "status_date", label: "STATUS DATE" },
  { id: "actions", label: "" },
];

interface ModelInventoryTableProps {
  data: IModelInventory[];
  isLoading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  paginated?: boolean;
}

const DEFAULT_ROWS_PER_PAGE = 5;

const StatusBadge: React.FC<{ status: ModelInventoryStatus }> = ({
  status,
}) => {
  const statusStyles = {
    [ModelInventoryStatus.APPROVED]: { bg: "#c8e6c9", color: "#388e3c" },
    [ModelInventoryStatus.PENDING]: { bg: "#fff9c4", color: "#fbc02d" },
    [ModelInventoryStatus.RESTRICTED]: { bg: "#ffccbc", color: "#e64a19" },
    [ModelInventoryStatus.BLOCKED]: { bg: "#ffcdd2", color: "#d32f2f" },
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

const SecurityAssessmentBadge: React.FC<{ assessment: boolean }> = ({
  assessment,
}) => {
  const style = assessment
    ? { bg: "#c8e6c9", color: "#388e3c" }
    : { bg: "#ffcdd2", color: "#d32f2f" };

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
      {assessment ? "Yes" : "No"}
    </span>
  );
};

const CapabilitiesChips: React.FC<{ capabilities: string[] }> = ({
  capabilities,
}) => {
  return (
    <Stack direction="row" gap={1} flexWrap="wrap">
      {capabilities.slice(0, 3).map((capability, index) => (
        <Chip
          key={index}
          label={capability}
          size="small"
          sx={{
            fontSize: "0.7rem",
            height: "20px",
            backgroundColor: "#f5f5f5",
            color: "#666",
          }}
        />
      ))}
      {capabilities.length > 3 && (
        <Chip
          label={`+${capabilities.length - 3}`}
          size="small"
          sx={{
            fontSize: "0.7rem",
            height: "20px",
            backgroundColor: "#e0e0e0",
            color: "#666",
          }}
        />
      )}
    </Stack>
  );
};

const ModelInventoryTable: React.FC<ModelInventoryTableProps> = ({
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
    allowedRoles.modelInventory?.delete?.includes(userRoleName);

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
            .map((modelInventory) => (
              <TableRow
                key={modelInventory.id}
                sx={{
                  ...singleTheme.tableStyles.primary.body.row,
                  "&:hover": { backgroundColor: "#FBFBFB", cursor: "pointer" },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(modelInventory.id?.toString() || "");
                }}
              >
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {modelInventory.provider_model}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {modelInventory.version || "-"}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {modelInventory.approver}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  <CapabilitiesChips
                    capabilities={modelInventory.capabilities}
                  />
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  <SecurityAssessmentBadge
                    assessment={modelInventory.security_assessment}
                  />
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  <StatusBadge status={modelInventory.status} />
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {modelInventory.status_date
                    ? new Date(modelInventory.status_date).toLocaleDateString()
                    : "-"}
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
                      id={modelInventory.id}
                      onDelete={() =>
                        onDelete?.(modelInventory.id?.toString() || "")
                      }
                      onEdit={() => {
                        onEdit?.(modelInventory.id?.toString() || "");
                      }}
                      onMouseEvent={() => {}}
                      warningTitle="Delete this model?"
                      warningMessage="When you delete this model, all data related to this model will be removed. This action is non-recoverable."
                      type="ModelInventory"
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
              No model inventory data available.
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
                Showing {getRange} of {data?.length} model(s)
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

export default ModelInventoryTable;
