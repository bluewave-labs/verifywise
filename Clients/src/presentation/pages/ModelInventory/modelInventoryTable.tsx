/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useMemo, useEffect } from "react";
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
  Tooltip,
} from "@mui/material";
import TablePaginationActions from "../../components/TablePagination";
import "../../components/Table/index.css";
import singleTheme from "../../themes/v1SingleTheme";
import CustomIconButton from "../../components/IconButton";
import allowedRoles from "../../../application/constants/permissions";
import { useAuth } from "../../../application/hooks/useAuth";
import { ChevronsUpDown } from "lucide-react";

const SelectorVertical = (props: any) => <ChevronsUpDown size={16} {...props} />;
import EmptyState from "../../components/EmptyState";
import { ModelInventoryTableProps } from "../../../domain/interfaces/i.modelInventory";
import { getAllEntities } from "../../../application/repository/entity.repository";
import { User } from "../../../domain/types/User";
import {
  getPaginationRowCount,
  setPaginationRowCount,
} from "../../../application/utils/paginationStorage";
import {
  tableRowHoverStyle,
  tableRowDeletingStyle,
  loadingContainerStyle,
  tableFooterRowStyle,
  showingTextCellStyle,
  paginationMenuProps,
  paginationSelectStyle,
  paginationStyle,
} from "./style";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ModelInventoryStatus } from "../../../domain/enums/modelInventory.enum";
import Chip from "../../components/Chip";

dayjs.extend(utc);

// Constants for table
const TABLE_COLUMNS = [
  { id: "provider", label: "PROVIDER" },
  { id: "model", label: "MODEL" },
  { id: "version", label: "VERSION" },
  { id: "approver", label: "APPROVER" },
  // { id: "capabilities", label: "CAPABILITIES" },
  { id: "security_assessment", label: "SECURITY ASSESSMENT" },
  { id: "risks", label: "RISKS" },
  { id: "status", label: "STATUS" },
  { id: "status_date", label: "STATUS DATE" },
  { id: "actions", label: "" },
];

const DEFAULT_ROWS_PER_PAGE = 10;

const TooltipCell: React.FC<{ value: string | null | undefined }> = ({
  value,
}) => {
  const displayValue = value || "-";
  const shouldShowTooltip = displayValue.length > 24;

  return shouldShowTooltip ? (
    <Tooltip title={displayValue} arrow>
      <span>{displayValue}</span>
    </Tooltip>
  ) : (
    <span>{displayValue}</span>
  );
};

const StatusBadge: React.FC<{ status: ModelInventoryStatus }> = ({
  status,
}) => {
  return <Chip label={status} />;
};

const SecurityAssessmentBadge: React.FC<{ assessment: boolean }> = ({
  assessment,
}) => {
  return <Chip label={assessment ? "Yes" : "No"} />;
};

// const CapabilitiesChips: React.FC<{ capabilities: string[] }> = ({
//   capabilities,
// }) => {
//   return (
//     <Stack direction="row" flexWrap="wrap" sx={capabilitiesChipContainerStyle}>
//       {capabilities.slice(0, 3).map((capability, index) => (
//         <Chip
//           key={index}
//           label={capability}
//           size="small"
//           sx={capabilityChipStyle}
//         />
//       ))}
//       {capabilities.length > 3 && (
//         <Chip
//           label={`+${capabilities.length - 3}`}
//           size="small"
//           sx={capabilityChipExtraStyle}
//         />
//       )}
//     </Stack>
//   );
// };

const ModelInventoryTable: React.FC<ModelInventoryTableProps> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  onCheckModelHasRisks,
  paginated = true,
  deletingId,
  hidePagination = false,
  modelRisks = [],
}) => {
  const theme = useTheme();
  const { userRoleName } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    getPaginationRowCount("modelInventory", DEFAULT_ROWS_PER_PAGE)
  );
  const [users, setUsers] = useState<User[]>([]);

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await getAllEntities({ routeUrl: "/users" });
      if (response?.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Create a mapping of user IDs to user names
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((user) => {
      map.set(user.id.toString(), `${user.name} ${user.surname}`.trim());
    });
    return map;
  }, [users]);

  const isDeletingAllowed =
    allowedRoles.modelInventory?.delete?.includes(userRoleName);

  // Get risk count for a specific model
  const getModelRiskCount = useCallback((modelId: number) => {
    return modelRisks.filter(risk => risk.model_id === modelId).length;
  }, [modelRisks]);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newRowsPerPage = parseInt(event.target.value, 10);
      setRowsPerPage(newRowsPerPage);
      setPaginationRowCount("modelInventory", newRowsPerPage);
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
              component={"td"}
              className="model-inventory-table-header-cel"
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
            .slice(
              hidePagination ? 0 : page * rowsPerPage,
              hidePagination ? Math.min(data.length, 100) : page * rowsPerPage + rowsPerPage
            )
            .map((modelInventory) => (
              <TableRow
                key={modelInventory.id}
                sx={{
                  ...singleTheme.tableStyles.primary.body.row,
                  ...tableRowHoverStyle,
                  ...(deletingId === modelInventory.id?.toString() &&
                    tableRowDeletingStyle),
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(modelInventory.id?.toString() || "");
                }}
              >
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    whiteSpace: "nowrap",
                  }}
                >
                  <TooltipCell value={modelInventory.provider} />
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    whiteSpace: "nowrap",
                  }}
                >
                  <TooltipCell value={modelInventory.model} />
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    whiteSpace: "nowrap",
                  }}
                >
                  <TooltipCell value={modelInventory.version} />
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    whiteSpace: "nowrap",
                  }}
                >
                  <TooltipCell
                    value={userMap.get(modelInventory.approver?.toString())}
                  />
                </TableCell>
                {/* <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  <CapabilitiesChips capabilities={modelInventory.capabilities} />
                </TableCell> */}
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    whiteSpace: "nowrap",
                  }}
                >
                  <SecurityAssessmentBadge
                    assessment={modelInventory.security_assessment}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    whiteSpace: "nowrap",
                  }}
                >
                  {(() => {
                    const riskCount = getModelRiskCount(modelInventory.id || 0);
                    return riskCount > 0 ? (
                      <Typography variant="body2" sx={{ color: "#344054" }}>
                        {riskCount} risk{riskCount !== 1 ? "s" : ""}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: "#98A2B3" }}>
                        No risks
                      </Typography>
                    );
                  })()}
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    whiteSpace: "nowrap",
                  }}
                >
                  <StatusBadge status={modelInventory.status} />
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    whiteSpace: "nowrap",
                  }}
                >
                  <TooltipCell
                    value={
                      modelInventory.status_date
                        ? dayjs
                            .utc(modelInventory.status_date)
                            .format("YYYY-MM-DD")
                        : "-"
                    }
                  />
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    position: "sticky",
                    right: 0,
                    zIndex: 10,
                    minWidth: "50px",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {isDeletingAllowed && (
                    <CustomIconButton
                      id={modelInventory.id || 0}
                      onDelete={() =>
                        onDelete?.(modelInventory.id?.toString() || "")
                      }
                      onEdit={() => {
                        onEdit?.(modelInventory.id?.toString() || "");
                      }}
                      onMouseEvent={() => {}}
                      warningTitle="Delete this model?"
                      warningMessage="When you delete this model, all data related to this model will be removed. This action is non-recoverable."
                      type=""
                      checkForRisks={
                        onCheckModelHasRisks
                          ? () =>
                              onCheckModelHasRisks(
                                modelInventory.id?.toString() || "0"
                              )
                          : undefined
                      }
                      onDeleteWithRisks={
                        onDelete
                          ? (deleteRisks: boolean) =>
                              onDelete(
                                modelInventory.id?.toString() || "",
                                deleteRisks
                              )
                          : undefined
                      }
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
    [
      data,
      page,
      rowsPerPage,
      isDeletingAllowed,
      onEdit,
      onDelete,
      deletingId,
      userMap,
      getModelRiskCount,
      hidePagination,
    ]
  );

  if (isLoading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={loadingContainerStyle(theme)}
      >
        <Typography>Loading...</Typography>
      </Stack>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState message="There is currently no data in this table." />;
  }

  return (
    <TableContainer sx={{ overflowX: "auto" }}>
      <Table sx={singleTheme.tableStyles.primary.frame}>
        {tableHeader}
        {tableBody}
        {paginated && !hidePagination && (
          <TableFooter>
            <TableRow sx={tableFooterRowStyle(theme)}>
              <TableCell sx={showingTextCellStyle(theme)}>
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
                    MenuProps: paginationMenuProps(theme),
                    inputProps: { id: "pagination-dropdown" },
                    IconComponent: SelectorVertical,
                    sx: paginationSelectStyle(theme),
                  },
                }}
                sx={paginationStyle(theme)}
              />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  );
};

export default ModelInventoryTable;
