import { Theme } from "@mui/material";

// Main page styles (index.tsx)
export const workflowMainStack = {
    gap: "16px",
};

// Table row styles
export const workflowRowHover = {
    "&:hover": { backgroundColor: "#FBFBFB", cursor: "pointer" },
};

export const worklowTableRowDeletingStyle = {
    opacity: 0.6,
    backgroundColor: "#f5f5f5",
};

export const addNewWorkflowButton = {
    backgroundColor: "#13715B",
    border: "1px solid #13715B",
    gap: "8px",
};

// Pagination & footer
export const workflowFooterRow = (theme: Theme) => ({
    "& .MuiTableCell-root.MuiTableCell-footer": {
        paddingX: theme.spacing(8),
        paddingY: theme.spacing(4),
    },
});

export const workflowShowingText = (theme: Theme) => ({
    paddingX: theme.spacing(2),
    fontSize: 11,
    opacity: 0.7,
    fontWeight: 400,
    whiteSpace: 'nowrap' as const,
});

export const workflowPaginationMenu = (theme: Theme) => ({
    keepMounted: true,
    PaperProps: {
        className: "pagination-dropdown",
        sx: {
            mt: 0,
            mb: theme.spacing(2),
        },
    },
    transformOrigin: {
        vertical: "bottom" as const,
        horizontal: "left" as const,
    },
    anchorOrigin: {
        vertical: "top" as const,
        horizontal: "left" as const,
    },
    sx: { mt: theme.spacing(-2) },
});

export const workflowPaginationSelect = (theme: Theme) => ({
    ml: theme.spacing(4),
    mr: theme.spacing(12),
    minWidth: theme.spacing(20),
    textAlign: "left" as const,
    "&.Mui-focused > div": {
        backgroundColor: theme.palette.background.main,
    },
});

export const workflowPagination = (theme: Theme) => ({
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
});