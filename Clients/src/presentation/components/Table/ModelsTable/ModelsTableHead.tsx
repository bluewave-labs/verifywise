import { TableCell, TableHead, TableRow, Box, Typography, useTheme } from "@mui/material";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import singleTheme from "../../../themes/v1SingleTheme";
import { SortConfig } from "./index";

interface Column {
    id: string;
    label: string;
    sortable: boolean;
}

interface ModelsTableHeadProps {
    columns: Column[];
    sortConfig: SortConfig;
    onSort: (columnId: string) => void;
}

const ModelsTableHead: React.FC<ModelsTableHeadProps> = ({
    columns,
    sortConfig,
    onSort,
}) => {
    const theme = useTheme();
    return (
        <TableHead
            sx={{
                backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors,
            }}
        >
            <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                {columns.map((column, index) => {
                    const isFirstColumn = index === 0;
                    const isActionColumn = column.id === "actions";

                    return (
                        <TableCell
                            key={column.id}
                            sx={{
                                ...singleTheme.tableStyles.primary.header.cell,
                                textAlign: isFirstColumn ? "left" : "center",
                                ...(column.sortable
                                    ? {
                                        cursor: "pointer",
                                        userSelect: "none",
                                        "&:hover": {
                                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                                        },
                                    }
                                    : {}),
                                ...(isActionColumn
                                    ? {
                                        minWidth: "80px",
                                        maxWidth: "80px",
                                    }
                                    : {}),
                            }}
                            onClick={() => column.sortable && onSort(column.id)}
                        >
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 500,
                                        fontSize: "13px",
                                        color: sortConfig.key === column.id ? "primary.main" : "inherit",
                                    }}
                                >
                                    {column.label}
                                </Typography>
                                {column.sortable && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            color: sortConfig.key === column.id ? "primary.main" : theme.palette.text.muted,
                                        }}
                                    >
                                        {sortConfig.key === column.id && sortConfig.direction === "asc" && (
                                            <ChevronUp size={14} />
                                        )}
                                        {sortConfig.key === column.id && sortConfig.direction === "desc" && (
                                            <ChevronDown size={14} />
                                        )}
                                        {sortConfig.key !== column.id && (
                                            <ChevronsUpDown size={14} />
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </TableCell>
                    );
                })}
            </TableRow>
        </TableHead>
    );
};

export default ModelsTableHead;
