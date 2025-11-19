/* eslint-disable @typescript-eslint/no-explicit-any */
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
    Tooltip,
} from "@mui/material";
import TablePaginationActions from "../../components/TablePagination";
import CustomIconButton from "../../components/IconButton";
import { ChevronsUpDown } from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { User } from "../../../domain/types/User";
import { getAllEntities } from "../../../application/repository/entity.repository";
import EmptyState from "../../components/EmptyState";
import { EvidenceHubModel } from "../../../domain/models/Common/evidenceHub/evidenceHub.model";
import {
    loadingContainerStyle,
    paginationMenuProps,
    paginationSelectStyle,
    paginationStyle,
    showingTextCellStyle,
    tableFooterRowStyle,
    tableRowDeletingStyle,
    tableRowHoverStyle,
} from "./style";
import { singleTheme } from "../../themes";
import { IModelInventory } from "../../../domain/interfaces/i.modelInventory";

dayjs.extend(utc);

const SelectorVertical = (props: any) => (
    <ChevronsUpDown size={16} {...props} />
);

interface EvidenceHubTableProps {
    data: EvidenceHubModel[];
    isLoading?: boolean;
    onEdit?: (id: number) => void;
    onDelete?: (id: number) => void;
    paginated?: boolean;
    deletingId?: number | null;
    modelInventoryData: IModelInventory[];
}

const TABLE_COLUMNS = [
    { id: "evidence_name", label: "EVIDENCE NAME" },
    { id: "evidence_type", label: "TYPE" },
    { id: "mapped_models", label: "MAPPED MODELS" },
    { id: "uploaded_by", label: "UPLOADED BY" },
    { id: "uploaded_on", label: "UPLOADED ON" },
    { id: "expiry_date", label: "EXPIRY" },
    { id: "actions", label: "" },
];

const TooltipCell = ({ value }: { value: string }) => {
    const truncate = (text: string, length = 25) => {
        if (!text) return "";
        return text.length > length ? text.substring(0, length) + "..." : text;
    };

    return (
        <Tooltip title={value}>
            <span>{truncate(value)}</span>
        </Tooltip>
    );
};

const EvidenceHubTable: React.FC<EvidenceHubTableProps> = ({
    data,
    isLoading,
    onEdit,
    onDelete,
    paginated = true,
    deletingId,
    modelInventoryData,
}) => {
    const theme = useTheme();
    const [users, setUsers] = useState<User[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const getRange = useMemo(() => {
        const start = page * rowsPerPage + 1;
        const end = Math.min(
            page * rowsPerPage + rowsPerPage,
            data?.length ?? 0
        );
        return `${start} - ${end}`;
    }, [page, rowsPerPage, data?.length]);

    // Fetch users for uploaded_by mapping
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await getAllEntities({ routeUrl: "/users" });
            if (res?.data) setUsers(res.data);
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

    const modelMap = useMemo(() => {
        const map = new Map<number, string>();

        modelInventoryData
            ?.filter((m) => typeof m.id === "number")
            .forEach((m) => {
                map.set(
                    m.id!, // safe because we filtered above
                    `${m.provider} - ${m.model}`
                );
            });

        return map;
    }, [modelInventoryData]);

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
                  className="evidence-hub-table-header-cel"
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
                  {column.label}
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
                {data?.length ? (
                    data
                        .slice(
                            page * rowsPerPage,
                            page * rowsPerPage + rowsPerPage
                        )
                        .map((evidence) => (
                            <TableRow key={evidence.id}
                            sx={{
                              ...singleTheme.tableStyles.primary.body.row,
                              ...tableRowHoverStyle,
                              ...(deletingId === evidence.id?.toString() &&
                                tableRowDeletingStyle),
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit?.(Number(evidence.id));
                            }}>
                                <TableCell>{evidence.evidence_name}</TableCell>
                                <TableCell>
                                    <TooltipCell
                                        value={evidence.evidence_type}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TooltipCell
                                        value={
                                            evidence.mapped_model_ids?.length
                                                ? evidence.mapped_model_ids
                                                      .map(
                                                          (id) =>
                                                              modelMap.get(
                                                                  id
                                                              ) || `Model ${id}`
                                                      )
                                                      .join(", ")
                                                : "-"
                                        }
                                    />
                                </TableCell>
                                <TableCell>
                                <TooltipCell
                                    value={
                                        evidence.evidence_files &&
                                        evidence.evidence_files.length > 0
                                            ? userMap.get(
                                                  evidence.evidence_files[0].uploaded_by.toString()
                                              ) || "-"
                                            : "-"
                                    }
                                />
                                </TableCell>

                                <TableCell>
                                    {evidence.evidence_files &&
                                    evidence.evidence_files.length > 0
                                        ? dayjs
                                              .utc(
                                                  evidence.evidence_files[0]
                                                      .upload_date
                                              )
                                              .format("YYYY-MM-DD")
                                        : "-"}
                                </TableCell>
                                <TableCell>
                                    {evidence.expiry_date
                                        ? dayjs
                                              .utc(evidence.expiry_date)
                                              .format("YYYY-MM-DD")
                                        : "-"}
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={1}>
                                        <CustomIconButton
                                            id={evidence.id || 0}
                                            onDelete={() =>
                                                onDelete?.(evidence.id || 0)
                                            }
                                            onEdit={() => {
                                                onEdit?.(evidence.id || 0);
                                            }}
                                            type=""
                                            warningTitle="Delete this evidence?"
                                            warningMessage="When you delete this evidence, all data related to this evidence will be removed. This action is non-recoverable."
                                            onMouseEvent={() => {}}
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
                        >
                            <EmptyState message="No evidence found." />
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        ),
        [data, page, rowsPerPage, deletingId, userMap, onEdit, modelMap, onDelete]
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
            <EmptyState message="There is currently no data in this table." />
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
                                        inputProps: {
                                            id: "pagination-dropdown",
                                        },
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

export default EvidenceHubTable;
