/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Checkbox,
    Stack,
    Typography,
    TableFooter,
    TablePagination,
    TableContainer,
} from "@mui/material";

import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";

import StandardModal from "../Modals/StandardModal";

import { getAllProjectRisks } from "../../../application/repository/projectRisk.repository";
import { handleAlert } from "../../../application/tools/alertUtils";
import { singleTheme } from "../../themes";
import { useUserMap } from "../../../presentation/hooks/userMap";

const SORT_KEY = "vw_link_risk_selector_sort";

type SortDirection = "asc" | "desc" | null;
type SortConfig = { key: string; direction: SortDirection };

interface LinkRiskSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    linkedRiskIds: number[];
    policyId: number;
    onSubmit: (selectedIds: number[]) => Promise<void>;
}

const TABLE_COLUMNS = [
    { id: "risk_name", label: "RISK NAME", sortable: true },
    { id: "likelihood", label: "LIKELIHOOD", sortable: true },
    { id: "severity", label: "SEVERITY", sortable: true },
    { id: "risk_level_autocalculated", label: "LEVEL", sortable: true },
    { id: "risk_owner", label: "RISK OWNER", sortable: true },
    { id: "actions", label: "", sortable: false },
];

// -----------------------------
// Sortable Header Component
// -----------------------------
const SortableTableHead = ({
    columns,
    sortConfig,
    onSort,
}: {
    columns: typeof TABLE_COLUMNS;
    sortConfig: SortConfig;
    onSort: (columnId: string) => void;
}) => {
    return (
        <TableHead
            sx={{
                backgroundColor:
                    singleTheme.tableStyles.primary.header.backgroundColors,
            }}
        >
            <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                <TableCell width={50}></TableCell>

                {columns.map((column) => (
                    <TableCell
                        key={column.id}
                        onClick={() => column.sortable && onSort(column.id)}
                        sx={{
                            ...singleTheme.tableStyles.primary.header.cell,
                            ...(column.sortable
                                ? {
                                      cursor: "pointer",
                                      userSelect: "none",
                                      "&:hover": {
                                          backgroundColor: "rgba(0,0,0,0.04)",
                                      },
                                  }
                                : {}),
                        }}
                    >
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 500,
                                    color:
                                        sortConfig.key === column.id
                                            ? "primary.main"
                                            : "inherit",
                                }}
                            >
                                {column.label}
                            </Typography>

                            {/* Sorting Icon */}
                            {column.sortable && (
                                <>
                                    {sortConfig.key === column.id &&
                                        sortConfig.direction === "asc" && (
                                            <ChevronUp size={16} />
                                        )}
                                    {sortConfig.key === column.id &&
                                        sortConfig.direction === "desc" && (
                                            <ChevronDown size={16} />
                                        )}
                                    {sortConfig.key !== column.id && (
                                        <ChevronsUpDown size={16} />
                                    )}
                                </>
                            )}
                        </Stack>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
};

// -----------------------------
// MAIN COMPONENT
// -----------------------------
const LinkRiskSelectorModal: React.FC<LinkRiskSelectorModalProps> = ({
    isOpen,
    onClose,
    linkedRiskIds,
    policyId,
    onSubmit,
}) => {
    const [risks, setRisks] = useState<any[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [, setIsLoading] = useState(false);

    console.log("linkedRiskIds", linkedRiskIds)

    // Sorting
    const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
        const saved = localStorage.getItem(SORT_KEY);
        return saved ? JSON.parse(saved) : { key: "", direction: null };
    });

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Toast helper
    const [, setAlert] = useState<any>(null);

    console.log("policyId", policyId);

    const toast = (variant: any, msg: string) => {
        handleAlert({ variant, body: msg, setAlert });
        setTimeout(() => setAlert(null), 2500);
    };

    // -----------------------------
    // Fetch All Risks
    // -----------------------------
    const fetchRisks = useCallback(async () => {
        try {
            const res = await getAllProjectRisks({ filter: "active" });
            setRisks(res.data || []);
        } catch (e) {
            console.error("error", e);
            toast("error", "Failed to load risks.");
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSelected([]);
            fetchRisks();
        }
    }, [isOpen, fetchRisks]);

    // -----------------------------
    // Sorting Logic
    // -----------------------------
    const sortedRisks = useMemo(() => {
        if (!sortConfig.key || !sortConfig.direction) return risks;

        return [...risks].sort((a, b) => {
            const A = (a[sortConfig.key] || "").toString().toLowerCase();
            const B = (b[sortConfig.key] || "").toString().toLowerCase();

            if (A < B) return sortConfig.direction === "asc" ? -1 : 1;
            if (A > B) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [risks, sortConfig]);

    console.log("sortedRisks", sortedRisks)

    const paginatedItems = sortedRisks.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    // -----------------------------
    // Handle Sorting
    // -----------------------------
    const handleSort = (columnId: string) => {
        setSortConfig((prev) => {
            if (prev.key === columnId) {
                if (prev.direction === "asc")
                    return { key: columnId, direction: "desc" };
                if (prev.direction === "desc")
                    return { key: "", direction: null };
            }
            return { key: columnId, direction: "asc" };
        });

        localStorage.setItem(
            SORT_KEY,
            JSON.stringify({ key: columnId, direction: "asc" })
        );
    };

    // -----------------------------
    // Selection Handlers
    // -----------------------------
    const toggleSelect = (id: number) => {
        if (linkedRiskIds.includes(id)) return; // already linked → disabled

        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    // -----------------------------
    // Submit Handler
    // -----------------------------
    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            await onSubmit(selected);
            toast("success", "Risks linked successfully!");
            onClose();
        } catch {
            toast("error", "Failed to link selected risks.");
        } finally {
            setIsLoading(false);
        }
    };

    const { userMap } = useUserMap();

    return (
        <StandardModal
            isOpen={isOpen}
            onClose={onClose}
            title="Link New Risks"
            description="Select risks to link with this policy."
            onSubmit={selected.length > 0 ? handleSubmit : undefined}
            //   submitting={isLoading}
        >
            <TableContainer sx={{ maxHeight: 450, overflow: "auto" }}>
                <Table stickyHeader>
                    <SortableTableHead
                        columns={TABLE_COLUMNS}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                    />

                    <TableBody>
                        {paginatedItems.map((risk) => {
                            // const disabled = linkedRiskIds.includes(risk.id);
                            
                            const disabled = linkedRiskIds.some(
                                (linkedId) => Number(linkedId) === Number(risk.id)
                              );
                            return (
                                <TableRow
                                    key={risk.id}
                                    sx={{
                                        opacity: disabled ? 0.4 : 1,
                                        cursor: disabled
                                            ? "not-allowed"
                                            : "pointer",
                                    }}
                                    onClick={() =>
                                        !disabled && toggleSelect(risk.id)
                                    }
                                >
                                    {/* checkbox */}
                                    <TableCell width={50}>
                                        <Checkbox
                                            disabled={disabled}
                                            checked={selected.includes(risk.id)}
                                            onChange={() =>
                                                toggleSelect(risk.id)
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </TableCell>

                                    <TableCell>{risk.risk_name}</TableCell>
                                    <TableCell>{risk.likelihood}</TableCell>
                                    <TableCell>{risk.severity}</TableCell>
                                    <TableCell>
                                        {risk.risk_level_autocalculated}
                                    </TableCell>
                                    <TableCell>
                                        {risk
                                            ? userMap.get(
                                                  String(risk.risk_owner)
                                              ) || "-"
                                            : "-"}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <TableFooter>
                    <TableRow>
                        <TablePagination
                            count={sortedRisks.length}
                            page={page}
                            onPageChange={(_, p) => setPage(p)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[5, 10, 15, 25]}
                        />
                    </TableRow>
                </TableFooter>
            </TableContainer>
        </StandardModal>
    );
};

export default LinkRiskSelectorModal;
