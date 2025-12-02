import {
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Box,
    useTheme,
    Chip,
    Stack,
} from "@mui/material";
import { ApprovalWorkflowModel } from "../../../domain/models/Common/approvalWorkflow/approvalWorkflow.model";
import {
    ApprovalStatus
} from "../../../domain/enums/aiApprovalWorkflow.enum";

import {
    workflowRowHover,
    worklowTableRowDeletingStyle
} from "./style";
import CustomIconButton from "../../components/IconButton";

import { singleTheme } from "../../themes";
import { useMemo, useState, useCallback, useEffect } from "react";
import dayjs from "dayjs";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";

const entities = [
    { _id: 1, name: "Use case" }
];

//  badge style generator
const getWorkflowChipProps = (value: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
        [ApprovalStatus.APPROVED]: {
            bg: "#E6F4EA",
            color: "#2E7D32",
        },
        [ApprovalStatus.REJECTED]: {
            bg: "#FDECEA",
            color: "#C62828",
        },
        [ApprovalStatus.PENDING]: {
            bg: "#F5F5F5",
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
    { id: "workflow_title", label: "TITLE" },
    { id: "entity_name", label: "ENTITY" },
    { id: "steps", label: "STEPS COUNT" },
    { id: "approval_status", label: "APPROVAL STATUS" },
    { id: "date_updated", label: "DATE UPDATED" },
    { id: "actions", label: "ACTIONS" },
];

const WORKFLOW_TABLE_SORTING_KEY = "verifywise_workflow_table_sorting";

type SortDirection = "asc" | "desc" | null;
type SortConfig = {
  key: string;
  direction: SortDirection;
};

interface ApprovalWorkflowTableProps {
    data: ApprovalWorkflowModel[];
    isLoading?: boolean;
    onEdit?: (id: string, mode: string) => void;
    onArchive?: (id: string, mode: string) => void;
    archivedId?: string | null;
}


const ApprovalWorkflowsTable: React.FC<ApprovalWorkflowTableProps> = ({
    data,
    onEdit,
    onArchive,
    archivedId,
}) => {

    const theme = useTheme();

    // Initialize sorting state from localStorage or default to no sorting
    const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
        const saved = localStorage.getItem(WORKFLOW_TABLE_SORTING_KEY);
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
        localStorage.setItem(WORKFLOW_TABLE_SORTING_KEY, JSON.stringify(sortConfig));
    }, [sortConfig]);

    // Sorting handler
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

    // Sort the workflow data based on current sort configuration
    const sortedData = useMemo(() => {
        if (!data || !sortConfig.key || !sortConfig.direction) {
            return data || [];
        }

        const sortableData = [...data];

        return sortableData.sort((a: ApprovalWorkflowModel, b: ApprovalWorkflowModel) => {
            let aValue: string | number;
            let bValue: string | number;

            const sortKey = sortConfig.key.trim().toLowerCase();

            // Handle different column types for workflows
            if (sortKey.includes("title")) {
                aValue = a.workflow_title?.toLowerCase() || "";
                bValue = b.workflow_title?.toLowerCase() || "";
            } else if (sortKey.includes("entity")) {
                const aEntity = entities.find(e => e._id == a.entity)?.name || "";
                const bEntity = entities.find(e => e._id == b.entity)?.name || "";
                aValue = aEntity.toLowerCase();
                bValue = bEntity.toLowerCase();
            } else if (sortKey.includes("steps")) {
                aValue = a.steps?.length || 0;
                bValue = b.steps?.length || 0;
            } else if (sortKey.includes("approval") && sortKey.includes("status")) {
                aValue = a.approval_status?.toLowerCase() || "";
                bValue = b.approval_status?.toLowerCase() || "";
            } else if (sortKey.includes("date") && sortKey.includes("updated")) {
                aValue = a.date_updated ? new Date(a.date_updated).getTime() : 0;
                bValue = b.date_updated ? new Date(b.date_updated).getTime() : 0;
            } else {
                return 0;
            }

            // Handle string comparisons
            if (typeof aValue === "string" && typeof bValue === "string") {
                const comparison = aValue.localeCompare(bValue);
                return sortConfig.direction === "asc" ? comparison : -comparison;
            }

            // Handle number comparisons
            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

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
                                key={column.id}
                                sx={{
                                    ...singleTheme.tableStyles.primary.header.cell,
                                    ...(column.id === "workflow_id" && {
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
                    sortedData.map((workflow) => (
                        <TableRow
                            key={workflow.id}
                            sx={{
                                ...singleTheme.tableStyles.primary.body.row,
                                ...workflowRowHover,
                                ...(archivedId ===
                                    workflow.id?.toString() &&
                                    worklowTableRowDeletingStyle),
                            }}
                        >
                            <TableCell
                                sx={{
                                    ...cellStyle,
                                    backgroundColor: sortConfig.key && sortConfig.key.toLowerCase().includes("title") ? "#f5f5f5" : "#fafafa",
                                }}
                            >
                                {workflow.workflow_title}
                            </TableCell>
                            <TableCell
                                sx={{
                                    ...cellStyle,
                                    backgroundColor: sortConfig.key && sortConfig.key.toLowerCase().includes("entity") ? "#f5f5f5" : "#ffffff",
                                }}
                            >
                                {entities.find(e => e._id == workflow.entity)?.name}
                            </TableCell>
                            <TableCell
                                sx={{
                                    ...cellStyle,
                                    backgroundColor: sortConfig.key && sortConfig.key.toLowerCase().includes("steps") ? "#f5f5f5" : "#ffffff",
                                }}
                            >
                                {workflow.steps?.length}
                            </TableCell>
                            <TableCell
                                sx={{
                                    ...cellStyle,
                                    backgroundColor: sortConfig.key && sortConfig.key.toLowerCase().includes("approval") && sortConfig.key.toLowerCase().includes("status") ? "#f5f5f5" : "#ffffff",
                                }}
                            >
                                <Chip
                                    {...getWorkflowChipProps(
                                        workflow.approval_status
                                    )}
                                />
                            </TableCell>
                            <TableCell
                                sx={{
                                    ...cellStyle,
                                    backgroundColor: sortConfig.key && sortConfig.key.toLowerCase().includes("date") && sortConfig.key.toLowerCase().includes("updated") ? "#f5f5f5" : "#ffffff",
                                }}
                            >
                                {workflow.date_updated
                                    ? dayjs
                                        .utc(workflow.date_updated)
                                        .format("YYYY-MM-DD")
                                    : "-"}
                            </TableCell>
                            <TableCell
                                sx={{
                                    ...cellStyle,
                                    backgroundColor: "#ffffff",
                                }}
                            >
                                <Stack direction="row" spacing={1}>
                                    <CustomIconButton
                                        id={workflow.id}
                                        type="workflow"
                                        onEdit={() =>
                                            onEdit?.(
                                                workflow.id.toString(), "edit"
                                            )
                                        }
                                        onDelete={() =>
                                            onArchive?.(
                                                workflow.id.toString(), "archive"
                                            )
                                        }
                                        onMouseEvent={() => { }}
                                        warningTitle="Are you sure?"
                                        warningMessage="You are about to archive this workflow. This action cannot be undone. You can also choose to edit or view the workflow instead."
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
                            No approval workflow data available.
                        </TableCell>

                    </TableRow>
                )}
            </TableBody>
        ),
        [sortedData, archivedId, onEdit, onArchive]
    );

    return (
        <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={singleTheme.tableStyles.primary.frame}>
                {tableHeader}
                {tableBody}
            </Table>
        </TableContainer>
    )
}

export default ApprovalWorkflowsTable;