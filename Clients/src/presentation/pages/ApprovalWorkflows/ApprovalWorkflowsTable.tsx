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
import { useMemo } from "react";
import dayjs from "dayjs";

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
    { id: "steps", label: "STEPS" },
    { id: "conditions", label: "CONDITIONS" },
    { id: "approval_status", label: "APPROVAL STATUS" },
    { id: "date_updated", label: "DATE UPDATED" },
    { id: "actions", label: "ACTIONS" },
];


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
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: theme.spacing(2),
                                    }}
                                >
                                    {column.label}
                                </Box>
                            </TableCell>
                        );
                    })}
                </TableRow>
            </TableHead>
        ),
        [theme]
    );

    const tableBody = useMemo(
        () => (
            <TableBody>
                {data?.length > 0 ? (
                    data.map((workflow) => (
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
                                    width: "110px",
                                    maxWidth: "110px",
                                    backgroundColor: "#fafafa",
                                }}
                            >
                                {workflow.workflow_title}
                            </TableCell>
                            <TableCell
                                sx={{
                                    ...cellStyle,
                                    backgroundColor: "#ffffff",
                                }}
                            >
                                {workflow.entity_name}
                            </TableCell>
                            <TableCell
                                sx={{
                                    ...cellStyle,
                                    backgroundColor: "#ffffff",
                                }}
                            >
                                {workflow.steps}
                            </TableCell>
                            <TableCell
                                sx={{
                                    ...cellStyle,
                                    backgroundColor: "#ffffff",
                                }}
                            >
                                {workflow.conditions}
                            </TableCell>
                            <TableCell
                                sx={{
                                    ...cellStyle,
                                    backgroundColor: "#ffffff",
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
                                    backgroundColor: "#ffffff",
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
        [data, theme]
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