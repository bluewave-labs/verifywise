import React, { useState, useMemo, useCallback } from "react";
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
} from "@mui/material";
import TablePaginationActions from "../../components/TablePagination";
import { ReactComponent as SelectorVertical } from "../../assets/icons/selector-vertical.svg";
import Placeholder from "../../assets/imgs/empty-state.svg";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { singleTheme } from "../../themes";
import { IAIIncidentManagement } from "../../../domain/interfaces/i.incidentManagement";
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
export const getIncidentChipProps = (value: string) => {
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
    { id: "incident_id", label: "INCIDENT ID", width: "100px" },
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
    data: IAIIncidentManagement[];
    isLoading?: boolean;
    onEdit?: (id: string, mode: string) => void;
    onView?: (id: string, mode: string) => void;
    onArchive?: (id: string, mode: string) => void;
    paginated?: boolean;
    archivedId?: string | null;
}

const DEFAULT_ROWS_PER_PAGE = 10;
const STORAGE_KEY = 'incident-table-rows-per-page';

const TooltipCell: React.FC<{ value?: string | null }> = ({ value }) => {
    const displayValue = value || "-";
    return displayValue.length > 24 ? (
        <Tooltip title={displayValue} arrow>
            <span>{displayValue}</span>
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

    const getRange = useMemo(() => {
        const start = page * rowsPerPage + 1;
        const end = Math.min(
            page * rowsPerPage + rowsPerPage,
            data?.length ?? 0
        );
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
                            component="td"
                            className="incident-management-table-header-cel"
                            key={column.id}
                            sx={{
                                ...singleTheme.tableStyles.primary.header.cell,
                                ...(column.id === "incident_id" && {
                                    width: "100px",
                                    minWidth: "100px",
                                    maxWidth: "100px",
                                    paddingLeft: theme.spacing(2),
                                    paddingRight: theme.spacing(2),
                                }),
                                ...(column.id === "actions" && {
                                    position: "sticky",
                                    right: 0,
                                    zIndex: 10,
                                    backgroundColor:
                                        singleTheme.tableStyles.primary.header
                                            .backgroundColors,
                                }),
                            }}
                        >
                            <div style={{ fontWeight: 400 }}>
                                {column.label}
                            </div>
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
                                <TableCell sx={{
                                    ...cellStyle,
                                    width: "100px",
                                    minWidth: "100px",
                                    maxWidth: "100px",
                                    paddingLeft: theme.spacing(2),
                                    paddingRight: theme.spacing(2),
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                }}>
                                    {incident.incident_id}
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
        [data, page, rowsPerPage, archivedId, onEdit, onArchive, onView]
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

    if (!data || data.length === 0) {
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
            <Table sx={{...singleTheme.tableStyles.primary.frame, tableLayout: "fixed"}}>
                <colgroup>
                    <col style={{ width: "100px" }} />
                    <col />
                    <col />
                    <col />
                    <col />
                    <col />
                    <col />
                    <col />
                    <col />
                    <col style={{ width: "60px" }} />
                </colgroup>
                {tableHeader}
                {tableBody}
                {paginated && (
                    <TableFooter>
                        <TableRow sx={incidentFooterRow(theme)}>
                            <TableCell sx={incidentShowingText(theme)}>
                                Showing {getRange} of {data?.length} incident(s)
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
