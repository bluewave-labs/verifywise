import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TablePagination,
    TableRow,
    TableFooter,
    Typography,
    useTheme,
} from "@mui/material";
import singleTheme from "../../../themes/v1SingleTheme";
import { useCallback, useMemo, useState, useEffect } from "react";
import TablePaginationActions from "../../TablePagination";
import { ChevronsUpDown } from "lucide-react";
import ModelsTableHead from "./ModelsTableHead";
import ModelsTableBody from "./ModelsTableBody";
import { EmptyState } from "../../EmptyState";
import {
    getPaginationRowCount,
    setPaginationRowCount,
} from "../../../../application/utils/paginationStorage";

const SelectorVertical = (props: React.SVGAttributes<SVGSVGElement>) => (
    <ChevronsUpDown size={16} {...props} />
);

const MODELS_SORTING_KEY = "verifywise_models_sorting";

export type SortDirection = "asc" | "desc" | null;
export type SortConfig = {
    key: string;
    direction: SortDirection;
};

export interface ModelRow {
    id: string;
    modelName: string;
    modelProvider: string;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface ModelsTableProps {
    rows: ModelRow[];
    onRowClick?: (model: ModelRow) => void;
    onDelete?: (model: ModelRow) => void;
    loading?: boolean;
}

const columns = [
    { id: "modelName", label: "NAME", sortable: true },
    { id: "modelProvider", label: "PROVIDER", sortable: true },
    { id: "updatedAt", label: "DATE", sortable: true },
    { id: "actions", label: "ACTION", sortable: false },
];

const ModelsTable: React.FC<ModelsTableProps> = ({
    rows,
    onRowClick,
    onDelete,
    loading = false,
}) => {
    const theme = useTheme();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(() =>
        getPaginationRowCount("models", 10)
    );

    // Initialize sorting state from localStorage or default to date desc
    const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
        const saved = localStorage.getItem(MODELS_SORTING_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (!parsed.key || !parsed.direction) {
                    return { key: "updatedAt", direction: "desc" };
                }
                return parsed;
            } catch {
                return { key: "updatedAt", direction: "desc" };
            }
        }
        return { key: "updatedAt", direction: "desc" };
    });

    // Save sorting state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(MODELS_SORTING_KEY, JSON.stringify(sortConfig));
    }, [sortConfig]);

    // Sorting handler
    const handleSort = useCallback((columnId: string) => {
        setSortConfig((prevConfig) => {
            if (prevConfig.key === columnId) {
                if (prevConfig.direction === "asc") {
                    return { key: columnId, direction: "desc" };
                } else if (prevConfig.direction === "desc") {
                    return { key: "", direction: null };
                }
            }
            return { key: columnId, direction: "asc" };
        });
    }, []);

    // Sort the models based on current sort configuration
    const sortedRows = useMemo(() => {
        if (!rows || !sortConfig.key || !sortConfig.direction) {
            return rows || [];
        }

        const sortableRows = [...rows];

        return sortableRows.sort((a: ModelRow, b: ModelRow) => {
            let aValue: string | number;
            let bValue: string | number;

            switch (sortConfig.key) {
                case "modelName":
                    aValue = a.modelName.toLowerCase();
                    bValue = b.modelName.toLowerCase();
                    break;

                case "modelProvider":
                    aValue = a.modelProvider.toLowerCase();
                    bValue = b.modelProvider.toLowerCase();
                    break;

                case "updatedAt":
                    aValue = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                    bValue = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                    break;

                default:
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
    }, [rows, sortConfig]);

    // Ensure page is valid when rows change
    const rowCount = sortedRows.length;
    const validPage =
        rowCount === 0
            ? 0
            : Math.min(page, Math.max(0, Math.ceil(rowCount / rowsPerPage) - 1));

    useEffect(() => {
        if (page !== validPage) {
            setPage(validPage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rowCount, validPage]);

    const getRange = useMemo(() => {
        const start = page * rowsPerPage + 1;
        const end = Math.min(page * rowsPerPage + rowsPerPage, sortedRows?.length ?? 0);
        return `${start} - ${end}`;
    }, [page, rowsPerPage, sortedRows?.length]);

    const handleChangePage = useCallback((_: unknown, newPage: number) => {
        setPage(newPage);
    }, []);

    const handleChangeRowsPerPage = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newRowsPerPage = parseInt(event.target.value, 10);
            setRowsPerPage(newRowsPerPage);
            setPaginationRowCount("models", newRowsPerPage);
            setPage(0);
        },
        []
    );

    return (
        <TableContainer>
            <Table sx={{ ...singleTheme.tableStyles.primary.frame }}>
                <ModelsTableHead
                    columns={columns}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                />
                {loading ? (
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={columns.length} sx={{ textAlign: "center", py: 4 }}>
                                <Typography>Loading...</Typography>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                ) : sortedRows.length !== 0 ? (
                    <ModelsTableBody
                        rows={sortedRows}
                        page={validPage}
                        rowsPerPage={rowsPerPage}
                        onRowClick={onRowClick}
                        onDelete={onDelete}
                    />
                ) : (
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={columns.length} sx={{ border: "none", p: 0 }}>
                                <EmptyState message="No models found. Model preferences are automatically saved when you run an experiment." />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                )}
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={columns.length} sx={{ border: "none", p: 0 }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    paddingX: theme.spacing(4),
                                }}
                            >
                                <Typography
                                    sx={{
                                        paddingX: theme.spacing(2),
                                        fontSize: 12,
                                        opacity: 0.7,
                                        color: theme.palette.text.secondary,
                                    }}
                                >
                                    Showing {getRange} of {sortedRows?.length} model
                                    {sortedRows?.length !== 1 ? "s" : ""}
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                    <TablePagination
                                        component="div"
                                        count={sortedRows?.length}
                                        page={validPage}
                                        onPageChange={handleChangePage}
                                        rowsPerPage={rowsPerPage}
                                        rowsPerPageOptions={[5, 10, 15, 20, 25]}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                        ActionsComponent={(props) => (
                                            <TablePaginationActions {...props} />
                                        )}
                                        labelRowsPerPage="Models per page"
                                        labelDisplayedRows={({ page: p, count }) =>
                                            `Page ${p + 1} of ${Math.max(
                                                0,
                                                Math.ceil(count / rowsPerPage)
                                            )}`
                                        }
                                        sx={{
                                            mt: theme.spacing(6),
                                            color: theme.palette.text.secondary,
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
                                                        sx: { mt: 0, mb: theme.spacing(2) },
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
                                                },
                                            },
                                        }}
                                    />
                                </Box>
                            </Box>
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </TableContainer>
    );
};

export default ModelsTable;
