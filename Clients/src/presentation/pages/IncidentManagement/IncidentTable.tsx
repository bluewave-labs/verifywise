import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableFooter,
    TablePagination,
    TableRow,
    Stack,
    Typography,
    Tooltip,
    useTheme,
    Chip,
    Box,
} from "@mui/material";
import TablePaginationActions from "../../components/TablePagination";
import { ReactComponent as SelectorVertical } from "../../assets/icons/selector-vertical.svg";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import Placeholder from "../../assets/imgs/empty-state.svg";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { singleTheme } from "../../themes";
import { AIIncidentManagementModel } from "../../../domain/models/Common/incidentManagement/incidentManagement.model";
import {
    AIIncidentManagementApprovalStatus,
    IncidentManagementStatus,
    Severity,
} from "../../../domain/enums/aiIncidentManagement.enum";
import {
    incidentRowHover,
    incidentLoadingContainer,
    incidentEmptyContainer,
    incidentEmptyText,
    incidentFooterRow,
    incidentShowingText,
    incidentPaginationMenu,
    incidentPaginationSelect,
    incidentPagination,
    incidentTableRowDeletingStyle,
} from "./style";
import CustomIconButton from "../../components/IconButton";

dayjs.extend(utc);

//  badge style generator
 const getIncidentChipProps = (value: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
        // Severity
        [Severity.MINOR]: { bg: "#E6F4EA", color: "#2E7D32" },
        [Severity.SERIOUS]: { bg: "#FFF4E5", color: "#EF6C00" },
        [Severity.VERY_SERIOUS]: { bg: "#FDECEA", color: "#C62828" },

        // Status
        [IncidentManagementStatus.OPEN]: { bg: "#FFF9E6", color: "#F9A825" },
        [IncidentManagementStatus.INVESTIGATED]: {
            bg: "#FFF4E6",
            color: "#FB8C00",
        },
        [IncidentManagementStatus.MITIGATED]: {
            bg: "#E8F5E9",
            color: "#2E7D32",
        },
        [IncidentManagementStatus.CLOSED]: { bg: "#ECEFF1", color: "#455A64" },

        // Approval
        [AIIncidentManagementApprovalStatus.APPROVED]: {
            bg: "#E6F4EA",
            color: "#2E7D32",
        },
        [AIIncidentManagementApprovalStatus.REJECTED]: {
            bg: "#FDECEA",
            color: "#C62828",
        },
        [AIIncidentManagementApprovalStatus.PENDING]: {
            bg: "#F5F5F5",
            color: "#616161",
        },
        [AIIncidentManagementApprovalStatus.NOT_REQUIRED]: {
            bg: "#FAFAFA",
            color: "#616161",
        },
    };

    const style = styles[value] || { bg: "#F5F5F5", color: "#616161" };

    return {
        label: value,
        size: "small" as const,
        sx: {
            backgroundColor: style.bg,
            color: style.color,
            fontWeight: 500,
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            borderRadius: "4px",
            "& .MuiChip-label": {
              padding: "4px 8px",
            },
          },
    };
};

const cellStyle = singleTheme.tableStyles.primary.body.cell;

const TABLE_COLUMNS = [
    { id: "incident_id", label: "INCIDENT ID" },
    { id: "ai_project", label: "AI PROJECT" },
    { id: "type", label: "TYPE" },
    { id: "severity", label: "SEVERITY" },
    { id: "status", label: "STATUS" },
    { id: "occurred_date", label: "OCCURRED DATE" },
    { id: "reporter", label: "REPORTER" },
    { id: "approval_status", label: "APPROVAL STATUS" },
    { id: "approved_by", label: "APPROVED BY" },
    { id: "actions", label: "" },
];

interface IncidentTableProps {
    data: AIIncidentManagementModel[];
    isLoading?: boolean;
    onEdit?: (id: string, mode: string) => void;
    onView?: (id: string, mode: string) => void;
    onArchive?: (id: string, mode: string) => void;
    paginated?: boolean;
    archivedId?: string | null;
}

const DEFAULT_ROWS_PER_PAGE = 10;
const STORAGE_KEY = 'incident-table-rows-per-page';
const INCIDENT_TABLE_SORTING_KEY = "verifywise_incident_table_sorting";

type SortDirection = "asc" | "desc" | null;
type SortConfig = {
  key: string;
  direction: SortDirection;
};

const TooltipCell: React.FC<{ value?: string | null }> = ({ value }) => {
    const displayValue = value || "-";
    const shouldTruncate = displayValue.length > 30;
    const truncatedValue = shouldTruncate
        ? `${displayValue.substring(0, 30)}...`
        : displayValue;

    return shouldTruncate ? (
        <Tooltip title={displayValue} arrow>
            <span style={{ cursor: 'help' }}>{truncatedValue}</span>
        </Tooltip>
    ) : (
        <span>{displayValue}</span>
    );
};

const IncidentTable: React.FC<IncidentTableProps> = ({
    data,
    isLoading,
    onEdit,
    onView,
    onArchive,
    paginated = true,
    archivedId,
}) => {
    const theme = useTheme();
    const [page, setPage] = useState(0);

    // Initialize rowsPerPage from localStorage or default
    const [rowsPerPage, setRowsPerPage] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? parseInt(stored, 10) : DEFAULT_ROWS_PER_PAGE;
    });

    // Initialize sorting state from localStorage or default to no sorting
    const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
        const saved = localStorage.getItem(INCIDENT_TABLE_SORTING_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return { key: "", direction: null };
            }
        }
        return { key: "", direction: null };
    });

    // Save sorting state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(INCIDENT_TABLE_SORTING_KEY, JSON.stringify(sortConfig));
    }, [sortConfig]);

    const handleChangePage = useCallback(
        (_: unknown, newPage: number) => setPage(newPage),
        []
    );
    const handleChangeRowsPerPage = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newRowsPerPage = parseInt(event.target.value, 10);
            setRowsPerPage(newRowsPerPage);
            localStorage.setItem(STORAGE_KEY, newRowsPerPage.toString());
            setPage(0);
        },
        []
    );

    // Sorting handlers
    const handleSort = useCallback((columnId: string) => {
        setSortConfig((prevConfig) => {
            if (prevConfig.key === columnId) {
                // Toggle direction if same column, or clear if already descending
                if (prevConfig.direction === "asc") {
                    return { key: columnId, direction: "desc" };
                } else if (prevConfig.direction === "desc") {
                    return { key: "", direction: null };
                }
            }
            // New column or first sort
            return { key: columnId, direction: "asc" };
        });
    }, []);

    // Sort the incident data based on current sort configuration
    const sortedData = useMemo(() => {
        if (!data || !sortConfig.key || !sortConfig.direction) {
            return data || [];
        }

        const sortableData = [...data];

        return sortableData.sort((a: AIIncidentManagementModel, b: AIIncidentManagementModel) => {
            let aValue: string | number;
            let bValue: string | number;

            // Use exact column name matching - case insensitive
            const sortKey = sortConfig.key.trim().toLowerCase();

            // Handle different column types for incidents
            if (sortKey.includes("incident") && sortKey.includes("id")) {
                aValue = a.incident_id?.toString() || "";
                bValue = b.incident_id?.toString() || "";
            } else if (sortKey.includes("project")) {
                aValue = a.ai_project?.toLowerCase() || "";
                bValue = b.ai_project?.toLowerCase() || "";
            } else if (sortKey.includes("type")) {
                aValue = a.type?.toLowerCase() || "";
                bValue = b.type?.toLowerCase() || "";
            } else if (sortKey.includes("severity")) {
                aValue = a.severity?.toLowerCase() || "";
                bValue = b.severity?.toLowerCase() || "";
            } else if (sortKey.includes("status")) {
                aValue = a.status?.toLowerCase() || "";
                bValue = b.status?.toLowerCase() || "";
            } else if (sortKey.includes("occurred") || sortKey.includes("date")) {
                aValue = a.occurred_date ? new Date(a.occurred_date).getTime() : 0;
                bValue = b.occurred_date ? new Date(b.occurred_date).getTime() : 0;
            } else if (sortKey.includes("reporter")) {
                aValue = a.reporter?.toLowerCase() || "";
                bValue = b.reporter?.toLowerCase() || "";
            } else if (sortKey.includes("approval")) {
                aValue = a.approval_status?.toLowerCase() || "";
                bValue = b.approval_status?.toLowerCase() || "";
            } else if (sortKey.includes("approved") && sortKey.includes("by")) {
                aValue = a.approved_by?.toLowerCase() || "";
                bValue = b.approved_by?.toLowerCase() || "";
            } else {
                // Try to handle unknown columns by checking if they're properties of the incident
                if (sortKey && sortKey in a && sortKey in b) {
                    const aVal = (a as any)[sortKey];
                    const bVal = (b as any)[sortKey];
                    aValue = String(aVal).toLowerCase();
                    bValue = String(bVal).toLowerCase();
                    const comparison = aValue.localeCompare(bValue);
                    return sortConfig.direction === "asc" ? comparison : -comparison;
                }
                return 0;
            }

            // Handle string comparisons
            if (typeof aValue === "string" && typeof bValue === "string") {
                const comparison = aValue.localeCompare(bValue);
                return sortConfig.direction === "asc" ? comparison : -comparison;
            }

            // Handle number comparisons (for dates)
            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const getRange = useMemo(() => {
        const start = page * rowsPerPage + 1;
        const end = Math.min(
            page * rowsPerPage + rowsPerPage,
            sortedData?.length ?? 0
        );
        return `${start} - ${end}`;
    }, [page, rowsPerPage, sortedData?.length]);

    const tableHeader = useMemo(
        () => (
            <TableHead
                sx={{
                    backgroundColor:
                        singleTheme.tableStyles.primary.header.backgroundColors,
                }}
            >
                <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                    {TABLE_COLUMNS.map((column) => {
                        const isLastColumn = column.id === "actions";
                        const sortable = !["actions"].includes(column.id);

                        return (
                            <TableCell
                                component="td"
                                className="incident-management-table-header-cel"
                                key={column.id}
                                sx={{
                                    ...singleTheme.tableStyles.primary.header.cell,
                                    ...(column.id === "incident_id" && {
                                        width: "110px",
                                        maxWidth: "110px",
                                    }),
                                    ...(column.id === "actions" && {
                                        position: "sticky",
                                        right: 0,
                                        zIndex: 10,
                                        backgroundColor:
                                            singleTheme.tableStyles.primary.header
                                                .backgroundColors,
                                    }),
                                    ...(!isLastColumn && sortable
                                        ? {
                                            cursor: "pointer",
                                            userSelect: "none",
                                            "&:hover": {
                                                backgroundColor: "rgba(0, 0, 0, 0.04)",
                                            },
                                        }
                                        : {}),
                                }}
                                onClick={() => sortable && handleSort(column.label)}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: theme.spacing(2),
                                    }}
                                >
                                    <div style={{ fontWeight: 400, color: sortConfig.key === column.label ? "primary.main" : "inherit" }}>
                                        {column.label}
                                    </div>
                                    {sortable && (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                color: sortConfig.key === column.label ? "primary.main" : "#9CA3AF",
                                            }}
                                        >
                                            {sortConfig.key === column.label && sortConfig.direction === "asc" && (
                                                <ChevronUp size={16} />
                                            )}
                                            {sortConfig.key === column.label && sortConfig.direction === "desc" && (
                                                <ChevronDown size={16} />
                                            )}
                                            {sortConfig.key !== column.label && (
                                                <ChevronsUpDown size={16} />
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            </TableCell>
                        );
                    })}
                </TableRow>
            </TableHead>
        ),
        [sortConfig, handleSort, theme]
    );

    const tableBody = useMemo(
        () => (
            <TableBody>
                {sortedData?.length > 0 ? (
                    sortedData
                        .slice(
                            page * rowsPerPage,
                            page * rowsPerPage + rowsPerPage
                        )
                        .map((incident) => (
                            <TableRow
                                key={incident.id}
                                sx={{
                                    ...singleTheme.tableStyles.primary.body.row,
                                    ...incidentRowHover,
                                    ...(archivedId ===
                                        incident.id?.toString() &&
                                        incidentTableRowDeletingStyle),
                                }}
                                onClick={() =>
                                    onEdit?.(incident.id?.toString(), "edit")
                                }
                            >
                                <TableCell sx={{ ...cellStyle, width: "110px", maxWidth: "110px" }}>
                                    {incident.incident_id}{" "}
                                </TableCell>
                                <TableCell sx={cellStyle}>
                                    <TooltipCell value={incident.ai_project} />
                                </TableCell>
                                <TableCell sx={cellStyle}>
                                    <TooltipCell value={incident.type} />
                                </TableCell>

                                <TableCell sx={cellStyle}>
                                    <Chip
                                        {...getIncidentChipProps(
                                            incident.severity
                                        )}
                                    />
                                </TableCell>
                                <TableCell sx={cellStyle}>
                                    <Chip
                                        {...getIncidentChipProps(
                                            incident.status
                                        )}
                                    />
                                </TableCell>
                                <TableCell sx={cellStyle}>
                                    {incident.occurred_date
                                        ? dayjs
                                              .utc(incident.occurred_date)
                                              .format("YYYY-MM-DD")
                                        : "-"}
                                </TableCell>
                                <TableCell sx={cellStyle}>
                                    <TooltipCell value={incident.reporter} />
                                </TableCell>
                                <TableCell sx={cellStyle}>
                                    <Chip
                                        {...getIncidentChipProps(
                                            incident.approval_status
                                        )}
                                    />
                                </TableCell>
                                <TableCell sx={cellStyle}>
                                    <TooltipCell value={incident.approved_by} />
                                </TableCell>
                                <TableCell sx={cellStyle}>
                                    <Stack direction="row" spacing={1}>
                                        <CustomIconButton
                                            id={incident.id}
                                            type="Incident"
                                            onEdit={() =>
                                                onEdit?.(
                                                    incident.id?.toString(),
                                                    "edit"
                                                )
                                            }
                                            onDelete={() =>
                                                onArchive?.(
                                                    incident.id?.toString(),
                                                    "archive"
                                                )
                                            }
                                            onView={() =>
                                                onView?.(
                                                    incident.id?.toString(),
                                                    "view"
                                                )
                                            }
                                            onMouseEvent={() => {}}
                                            warningTitle="Are you sure?"
                                            warningMessage="You are about to archive this incident. This action cannot be undone. You can also choose to edit or view the incident instead."
                                        />
                                    </Stack>
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
                            No incident data available.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        ),
        [sortedData, page, rowsPerPage, archivedId, onEdit, onArchive, onView]
    );

    if (isLoading) {
        return (
            <Stack
                alignItems="center"
                justifyContent="center"
                sx={incidentLoadingContainer()}
            >
                <Typography>Loading...</Typography>
            </Stack>
        );
    }

    if (!sortedData || sortedData.length === 0) {
        return (
            <Stack
                alignItems="center"
                justifyContent="center"
                sx={incidentEmptyContainer()}
            >
                <img src={Placeholder} alt="Placeholder" />
                <Typography sx={incidentEmptyText}>
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
                        <TableRow sx={incidentFooterRow(theme)}>
                            <TableCell colSpan={3} sx={incidentShowingText(theme)}>
                                Showing {getRange} of {sortedData?.length} incident(s)
                            </TableCell>
                            <TablePagination
                                count={sortedData?.length ?? 0}
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
                                        MenuProps:
                                            incidentPaginationMenu(theme),
                                        inputProps: {
                                            id: "pagination-dropdown",
                                        },
                                        IconComponent: SelectorVertical,
                                        sx: incidentPaginationSelect(theme),
                                    },
                                }}
                                sx={incidentPagination(theme)}
                            />
                        </TableRow>
                    </TableFooter>
                )}
            </Table>
        </TableContainer>
    );
};

export default IncidentTable;
