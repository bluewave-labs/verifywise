import { useState } from "react";
import {
    TableBody,
    TableRow,
    TableCell,
    IconButton,
    Popover,
    Stack,
    Typography,
    Chip,
} from "@mui/material";
import { Trash2, MoreVertical } from "lucide-react";
import singleTheme from "../../../themes/v1SingleTheme";
import { ModelRow } from "./index";
import CustomizableButton from "../../Button/CustomizableButton";

interface ModelsTableBodyProps {
  rows: ModelRow[];
  page: number;
  rowsPerPage: number;
  onRowClick?: (model: ModelRow) => void;
  onDelete?: (model: ModelRow) => void;
}

const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }) + ", " + date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

// Provider color mapping for chips
const getProviderColor = (provider: string): { bg: string; text: string } => {
    const colors: Record<string, { bg: string; text: string }> = {
        openai: { bg: "#E8F5E9", text: "#2E7D32" },
        anthropic: { bg: "#FFF3E0", text: "#E65100" },
        google: { bg: "#E3F2FD", text: "#1565C0" },
        mistral: { bg: "#F3E5F5", text: "#7B1FA2" },
        ollama: { bg: "#ECEFF1", text: "#37474F" },
        huggingface: { bg: "#FFF8E1", text: "#F57F17" },
        xai: { bg: "#FAFAFA", text: "#212121" },
        bedrock: { bg: "#FFF3E0", text: "#FF6F00" },
    };
    return colors[provider.toLowerCase()] || { bg: "#F5F5F5", text: "#616161" };
};

const ModelsTableBody: React.FC<ModelsTableBodyProps> = ({
  rows,
  page,
  rowsPerPage,
  onRowClick,
  onDelete,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = useState<ModelRow | null>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, row: ModelRow) => {
        e.stopPropagation();
        setMenuAnchorEl(e.currentTarget);
        setMenuRow(row);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setMenuRow(null);
    };

    const handleDeleteClick = () => {
        if (menuRow && onDelete) {
            onDelete(menuRow);
        }
        handleMenuClose();
    };

    return (
        <TableBody>
            {rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((model) => {
                    const providerColors = getProviderColor(model.modelProvider);

                    return (
                        <TableRow
                            key={model.id}
                            onClick={() => onRowClick?.(model)}
                            sx={{
                                ...singleTheme.tableStyles.primary.body.row,
                                cursor: onRowClick ? "pointer" : "default",
                                "&:hover": {
                                    backgroundColor: "#F9FAFB",
                                },
                            }}
                        >
                            {/* NAME */}
                            <TableCell
                                sx={{
                                    ...singleTheme.tableStyles.primary.body.cell,
                                    textTransform: "none",
                                }}
                            >
                                <Typography sx={{ fontWeight: 500, fontSize: "14px" }}>
                                    {model.modelName || "-"}
                                </Typography>
                            </TableCell>

                            {/* DATE - center aligned */}
                            <TableCell
                                sx={{
                                    ...singleTheme.tableStyles.primary.body.cell,
                                    textAlign: "center",
                                    textTransform: "none",
                                }}
                            >
                                <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>
                                    {formatDate(model.updatedAt)}
                                </Typography>
                            </TableCell>

                            {/* PROVIDER - center aligned with chip */}
                            <TableCell
                                sx={{
                                    ...singleTheme.tableStyles.primary.body.cell,
                                    textAlign: "center",
                                    textTransform: "none",
                                }}
                            >
                                {model.modelProvider ? (
                                    <Chip
                                        label={model.modelProvider}
                                        size="small"
                                        sx={{
                                            backgroundColor: providerColors.bg,
                                            color: providerColors.text,
                                            fontWeight: 500,
                                            fontSize: "12px",
                                            height: "24px",
                                        }}
                                    />
                                ) : (
                                    "-"
                                )}
                            </TableCell>

                            {/* ACTION - center aligned */}
                            <TableCell
                                sx={{
                                    ...singleTheme.tableStyles.primary.body.cell,
                                    textAlign: "center",
                                    minWidth: "80px",
                                    maxWidth: "80px",
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <IconButton
                                    size="small"
                                    onClick={(e) => handleMenuOpen(e, model)}
                                    sx={{
                                        color: "#667085",
                                        padding: "6px",
                                        "&:hover": {
                                            backgroundColor: "#F3F4F6",
                                        },
                                    }}
                                >
                                    <MoreVertical size={18} />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    );
                })}

            {/* Action Menu */}
            <Popover
                open={Boolean(menuAnchorEl)}
                anchorEl={menuAnchorEl}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                sx={{
                    "& .MuiPopover-paper": {
                        minWidth: 120,
                        borderRadius: "4px",
                        border: "1px solid #d0d5dd",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        overflow: "hidden",
                        mt: 0.5,
                        p: 1,
                    },
                }}
            >
                <Stack spacing={1}>
                    {onDelete && (
                        <CustomizableButton
                            variant="outlined"
                            onClick={handleDeleteClick}
                            startIcon={<Trash2 size={14} />}
                            sx={{
                                height: "34px",
                                fontSize: "13px",
                                fontWeight: 500,
                                color: "#DC2626",
                                borderColor: "#d0d5dd",
                                backgroundColor: "transparent",
                                justifyContent: "flex-start",
                                "&:hover": {
                                    backgroundColor: "#FEF2F2",
                                    borderColor: "#DC2626",
                                },
                            }}
                        >
                            Delete
                        </CustomizableButton>
                    )}
                </Stack>
            </Popover>
        </TableBody>
    );
};

export default ModelsTableBody;
