import {
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableFooter,
    TablePagination,
    TableRow,
    TableCell,
    Box,
    useTheme,
    Stack
} from "@mui/material";

import {
    workflowRowHover,
    workflowFooterRow,
    workflowShowingText,
    workflowPaginationMenu,
    workflowPaginationSelect,
    workflowPagination,
    tableContainerStyle,
    headerCellEntityStyle,
    headerCellStepsStyle,
    headerCellDateStyle,
    headerCellActionsStyle,
    sortableHeaderStyle,
    headerContentBoxStyle,
    headerLabelStyle,
    sortIconBoxStyle,
    bodyCellTitleStyle,
    bodyCellEntityStyle,
    bodyCellStepsStyle,
    bodyCellDateStyle,
    bodyCellActionsStyle,
    emptyTableCellStyle,
} from "./style";

import CustomIconButton from "../../components/IconButton";
import { singleTheme } from "../../themes";
import { useMemo, useState, useCallback, useEffect } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { ApprovalRequest } from "./mockRequestsData";
import TablePaginationActions from "../../components/TablePagination";
import { REQUESTS_TABLE_COLUMNS } from "./requestsArray";
import Chip from "../../components/Chip";

const cellStyle = singleTheme.tableStyles.primary.body.cell;

const REQUESTS_TABLE_SORTING_KEY = "verifywise_requests_table_sorting";
const DEFAULT_ROWS_PER_PAGE = 10;
const STORAGE_KEY = 'requests-table-rows-per-page';

type SortDirection = "asc" | "desc" | null;
type SortConfig = {
    key: string;
    direction: SortDirection;
};


interface ApprovalRequestsTableProps {
    data: ApprovalRequest[];
    isLoading?: boolean;
    onOpenRequestDetails: (requestId: string) => void;
}

const ApprovalRequestsTable: React.FC<ApprovalRequestsTableProps> = ({
    data,
    onOpenRequestDetails,
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
        const saved = localStorage.getItem(REQUESTS_TABLE_SORTING_KEY);
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
        localStorage.setItem(REQUESTS_TABLE_SORTING_KEY, JSON.stringify(sortConfig));
    }, [sortConfig]);

    // Pagination handlers
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

    // Sort the requests data based on current sort configuration
    const sortedData = useMemo(() => {
        if (!data || !sortConfig.key || !sortConfig.direction) {
            return data || [];
        }

        const sortableData = [...data];

        return sortableData.sort((a: ApprovalRequest, b: ApprovalRequest) => {
            let aValue: string | number;
            let bValue: string | number;

            const sortKey = sortConfig.key.trim().toLowerCase();

            // Handle different column types for requests
            if (sortKey.includes("request") && sortKey.includes("name")) {
                aValue = a.request_name?.toLowerCase() || "";
                bValue = b.request_name?.toLowerCase() || "";
            } else if (sortKey.includes("workflow") && sortKey.includes("name")) {
                aValue = a.workflow_name?.toLowerCase() || "";
                bValue = b.workflow_name?.toLowerCase() || "";
            } else if (sortKey.includes("status")) {
                aValue = a.status?.toLowerCase() || "";
                bValue = b.status?.toLowerCase() || "";
            } else if (sortKey.includes("date") && sortKey.includes("requested")) {
                aValue = a.date_requested ? new Date(a.date_requested).getTime() : 0;
                bValue = b.date_requested ? new Date(b.date_requested).getTime() : 0;
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
                    {REQUESTS_TABLE_COLUMNS.map((column) => {
                        const isLastColumn = column.id === "actions";
                        const sortable = !["actions"].includes(column.id);

                        return (
                            <TableCell
                                component="td"
                                key={column.id}
                                sx={{
                                    ...singleTheme.tableStyles.primary.header.cell,
                                    ...(column.id === "workflow_name" && headerCellEntityStyle),
                                    ...(column.id === "status" && headerCellStepsStyle),
                                    ...(column.id === "date_requested" && headerCellDateStyle),
                                    ...(column.id === "actions" && headerCellActionsStyle(singleTheme.tableStyles.primary.header.backgroundColors)),
                                    ...(!isLastColumn && sortable && sortableHeaderStyle),
                                }}
                                onClick={() => sortable && handleSort(column.label)}
                            >
                                <Box sx={headerContentBoxStyle(theme)}>
                                    <Box sx={headerLabelStyle(sortConfig.key === column.label)}>
                                        {column.label}
                                    </Box>
                                    {sortable && (
                                        <Box sx={sortIconBoxStyle(sortConfig.key === column.label)}>
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

    // Paginate the sorted data
    const paginatedData = useMemo(() => {
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return sortedData.slice(startIndex, endIndex);
    }, [sortedData, page, rowsPerPage]);

    // Calculate display range for "Showing X-Y of Z"
    const getRange = useMemo(() => {
        if (!sortedData || sortedData.length === 0) return "0-0";
        const start = page * rowsPerPage + 1;
        const end = Math.min((page + 1) * rowsPerPage, sortedData.length);
        return `${start}-${end}`;
    }, [page, rowsPerPage, sortedData]);

    const tableBody = useMemo(
        () => (
            <TableBody>
                {paginatedData?.length > 0 ? (
                    paginatedData.map((request) => (
                        <TableRow
                            key={request.id}
                            sx={{
                                ...singleTheme.tableStyles.primary.body.row,
                                ...workflowRowHover,
                            }}
                        >
                            <TableCell
                                sx={bodyCellTitleStyle(cellStyle, !!(sortConfig.key && sortConfig.key.toLowerCase().includes("request")))}
                            >
                                {request.request_name}
                            </TableCell>
                            <TableCell
                                sx={bodyCellEntityStyle(cellStyle, !!(sortConfig.key && sortConfig.key.toLowerCase().includes("workflow")))}
                            >
                                {request.workflow_name}
                            </TableCell>
                            <TableCell
                                sx={bodyCellStepsStyle(cellStyle, !!(sortConfig.key && sortConfig.key.toLowerCase().includes("status")))}
                            >

                                <Chip label={request.status}
                                />
                            </TableCell>
                            <TableCell
                                sx={bodyCellDateStyle(cellStyle, !!(sortConfig.key && sortConfig.key.toLowerCase().includes("date") && sortConfig.key.toLowerCase().includes("requested")))}
                            >
                                {request.date_requested
                                    ? dayjs
                                        .utc(request.date_requested)
                                        .format("YYYY-MM-DD HH:mm")
                                    : "-"}
                            </TableCell>

                            <TableCell
                                sx={bodyCellActionsStyle(cellStyle)}
                            >
                                <Stack direction="row" spacing={1}>
                                    <CustomIconButton
                                        id={request.id}
                                        type="viewOnly"
                                        onView={() => onOpenRequestDetails(request.id.toString())}
                                        onMouseEvent={() => { }}
                                        canDelete={false}
                                        onDelete={() => { }}
                                        onEdit={() => { }} />
                                </Stack>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell
                            colSpan={REQUESTS_TABLE_COLUMNS.length}
                            align="center"
                            sx={emptyTableCellStyle}
                        >
                            No approval requests data available.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        ),
        [paginatedData, onOpenRequestDetails, sortConfig]
    );

    return (
        <TableContainer sx={tableContainerStyle}>
            <Table sx={singleTheme.tableStyles.primary.frame}>
                {tableHeader}
                {tableBody}
                <TableFooter>
                    <TableRow sx={workflowFooterRow(theme)}>
                        <TableCell colSpan={3} sx={workflowShowingText(theme)}>
                            Showing {getRange} of {sortedData?.length} request(s)
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
                                    MenuProps: workflowPaginationMenu(theme),
                                    sx: workflowPaginationSelect(theme),
                                },
                            }}
                            sx={workflowPagination(theme)}
                            colSpan={3}
                        />
                    </TableRow>
                </TableFooter>
            </Table>
        </TableContainer>
    )
}

export default ApprovalRequestsTable;