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
import { getAllEntities } from "../../../application/repository/entity.repository";
import { User } from "../../../domain/types/User";
import {
  statusBadgeStyle,
  securityAssessmentBadgeStyle,
  capabilitiesChipContainerStyle,
  capabilityChipStyle,
  capabilityChipExtraStyle,
  tableRowHoverStyle,
  tableRowDeletingStyle,
  loadingContainerStyle,
  emptyStateContainerStyle,
  emptyStateTextStyle,
  tableFooterRowStyle,
  showingTextCellStyle,
  paginationMenuProps,
  paginationSelectStyle,
  paginationStyle,
} from "./style";

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
  deletingId?: string | null;
}

const DEFAULT_ROWS_PER_PAGE = 5;

const StatusBadge: React.FC<{ status: ModelInventoryStatus }> = ({
  status,
}) => {
  return <span style={statusBadgeStyle(status)}>{status}</span>;
};

const SecurityAssessmentBadge: React.FC<{ assessment: boolean }> = ({
  assessment,
}) => {
  return (
    <span style={securityAssessmentBadgeStyle(assessment)}>
      {assessment ? "Yes" : "No"}
    </span>
  );
};

const CapabilitiesChips: React.FC<{ capabilities: string[] }> = ({
  capabilities,
}) => {
  return (
    <Stack direction="row" flexWrap="wrap" sx={capabilitiesChipContainerStyle}>
      {capabilities.slice(0, 3).map((capability, index) => (
        <Chip
          key={index}
          label={capability}
          size="small"
          sx={capabilityChipStyle}
        />
      ))}
      {capabilities.length > 3 && (
        <Chip
          label={`+${capabilities.length - 3}`}
          size="small"
          sx={capabilityChipExtraStyle}
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
  deletingId,
}) => {
  const theme = useTheme();
  const { userRoleName } = useContext(VerifyWiseContext);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
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
              <div style={{ fontWeight: 400 }}>{column.label}</div>
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
                  ...tableRowHoverStyle,
                  ...(deletingId === modelInventory.id?.toString() &&
                    tableRowDeletingStyle),
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
                  {userMap.get(modelInventory.approver) ||
                    modelInventory.approver}
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
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={emptyStateContainerStyle(theme)}
      >
        <img src={Placeholder} alt="Placeholder" />
        <Typography sx={emptyStateTextStyle}>
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
