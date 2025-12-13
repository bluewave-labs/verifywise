import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableFooter,
  TablePagination,
  Chip,
  IconButton,
  Popover,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from "@mui/material";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { Plus, Settings, Pencil, Trash2, ChevronsUpDown } from "lucide-react";
import SearchBox from "../../components/Search/SearchBox";
import { FilterBy, type FilterColumn } from "../../components/Table/FilterBy";
import { GroupBy } from "../../components/Table/GroupBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";
import {
  deepEvalScorersService,
  type DeepEvalScorer,
} from "../../../infrastructure/api/deepEvalScorersService";
import Alert from "../../components/Alert";
import TableHeader from "../../components/Table/TableHead";
import TablePaginationActions from "../../components/TablePagination";
import singleTheme from "../../themes/v1SingleTheme";
import StandardModal from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import {
  getPaginationRowCount,
  setPaginationRowCount,
} from "../../../application/utils/paginationStorage";
import EmptyState from "../../components/EmptyState";
import CreateScorerModal, { type ScorerConfig } from "./CreateScorerModal";

export interface ProjectScorersProps {
  projectId: string;
}

interface AlertState {
  variant: "success" | "error";
  body: string;
}

const StatusChip: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const styles = enabled
    ? { backgroundColor: "#c8e6c9", color: "#388e3c" }
    : { backgroundColor: "#e0e0e0", color: "#616161" };

  return (
    <Chip
      label={enabled ? "Enabled" : "Disabled"}
      size="small"
      sx={{
        ...styles,
        fontWeight: 500,
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        borderRadius: "4px",
        "& .MuiChip-label": {
          padding: "4px 8px",
        },
      }}
    />
  );
};

export default function ProjectScorers({ projectId }: ProjectScorersProps) {
  const theme = useTheme();
  const [scorers, setScorers] = useState<DeepEvalScorer[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    getPaginationRowCount("scorers", 10)
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null);

  // Gear menu state
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuScorer, setMenuScorer] = useState<DeepEvalScorer | null>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingScorer, setEditingScorer] = useState<DeepEvalScorer | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    metricKey: "",
    type: "llm" as "llm" | "builtin" | "custom",
    enabled: true,
    defaultThreshold: "",
    weight: "",
    judgeModel: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [scorerToDelete, setScorerToDelete] = useState<DeepEvalScorer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New comprehensive create scorer modal
  const [createScorerModalOpen, setCreateScorerModalOpen] = useState(false);

  const loadScorers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await deepEvalScorersService.list({ project_id: projectId });
      setScorers(res.scorers || []);
    } catch (err) {
      console.error("Failed to load scorers", err);
      setAlert({ variant: "error", body: "Failed to load scorers" });
      setTimeout(() => setAlert(null), 4000);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    void loadScorers();
  }, [projectId, loadScorers]);

  const filterColumns: FilterColumn[] = useMemo(
    () => [
      { id: "name", label: "Scorer name", type: "text" },
      { id: "metricKey", label: "Metric key", type: "text" },
      {
        id: "type",
        label: "Type",
        type: "select",
        options: [
          { value: "llm", label: "LLM" },
          { value: "builtin", label: "Builtin" },
          { value: "custom", label: "Custom" },
        ],
      },
    ],
    []
  );

  const getFieldValue = useCallback(
    (
      s: DeepEvalScorer,
      fieldId: string
    ): string | number | Date | null | undefined => {
      switch (fieldId) {
        case "name":
          return s.name;
        case "metricKey":
          return s.metricKey;
        case "type":
          return s.type;
        default:
          return "";
      }
    },
    []
  );

  const { filterData, handleFilterChange } =
    useFilterBy<DeepEvalScorer>(getFieldValue);

  const filteredScorers = useMemo(() => {
    const afterFilter = filterData(scorers);
    if (!searchTerm.trim()) return afterFilter;
    const q = searchTerm.toLowerCase();
    return afterFilter.filter((s) =>
      [s.name, s.metricKey, s.type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [scorers, filterData, searchTerm]);

  const tableColumns = ["SCORER", "MODEL / JUDGE", "TYPE", "METRIC", "STATUS", "ACTION"];

  // Gear menu handlers
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    scorer: DeepEvalScorer
  ) => {
    setMenuAnchor(event.currentTarget);
    setMenuScorer(scorer);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuScorer(null);
  };

  const handleEditClick = () => {
    if (menuScorer) {
      setEditingScorer(menuScorer);
      setEditForm({
        name: menuScorer.name,
        description: menuScorer.description || "",
        metricKey: menuScorer.metricKey,
        type: menuScorer.type,
        enabled: menuScorer.enabled,
        defaultThreshold:
          menuScorer.defaultThreshold != null
            ? String(menuScorer.defaultThreshold)
            : "",
        weight: menuScorer.weight != null ? String(menuScorer.weight) : "",
        judgeModel: menuScorer.config?.judgeModel || "",
      });
      setEditModalOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    if (!menuScorer) return;
    setScorerToDelete(menuScorer);
    setDeleteModalOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    if (!scorerToDelete) return;
    setIsDeleting(true);
    try {
      await deepEvalScorersService.delete(scorerToDelete.id);
      setAlert({ variant: "success", body: "Scorer deleted" });
      setTimeout(() => setAlert(null), 3000);
      setDeleteModalOpen(false);
      setScorerToDelete(null);
      void loadScorers();
    } catch (err) {
      console.error("Failed to delete scorer", err);
      setAlert({ variant: "error", body: "Failed to delete scorer" });
      setTimeout(() => setAlert(null), 4000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Edit modal submit
  const handleEditSubmit = async () => {
    if (!editingScorer) return;
    setIsSubmitting(true);
    try {
      await deepEvalScorersService.update(editingScorer.id, {
        name: editForm.name,
        description: editForm.description || undefined,
        metricKey: editForm.metricKey,
        type: editForm.type,
        enabled: editForm.enabled,
        defaultThreshold: editForm.defaultThreshold
          ? parseFloat(editForm.defaultThreshold)
          : undefined,
        weight: editForm.weight ? parseFloat(editForm.weight) : undefined,
        config: {
          ...editingScorer.config,
          judgeModel: editForm.judgeModel || undefined,
        },
      });
      setAlert({ variant: "success", body: "Scorer updated" });
      setTimeout(() => setAlert(null), 3000);
      setEditModalOpen(false);
      setEditingScorer(null);
      void loadScorers();
    } catch (err) {
      console.error("Failed to update scorer", err);
      setAlert({ variant: "error", body: "Failed to update scorer" });
      setTimeout(() => setAlert(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create scorer - opens the comprehensive modal
  const handleCreateScorer = () => {
    setCreateScorerModalOpen(true);
  };

  // Handle submit from the new comprehensive scorer modal
  const handleNewScorerSubmit = async (config: ScorerConfig) => {
    try {
      await deepEvalScorersService.create({
        projectId,
        name: config.name,
        description: `${config.type.toUpperCase()} scorer with ${config.choiceScores.length} choice scores`,
        metricKey: config.slug,
        type: config.type === "llm" ? "llm" : "custom",
        enabled: true,
        defaultThreshold: config.passThreshold,
        weight: 1.0,
        config: {
          judgeModel: config.model,
          messages: config.messages,
          useChainOfThought: config.useChainOfThought,
          choiceScores: config.choiceScores,
          inputSchema: config.inputSchema,
        },
      });
      setAlert({ variant: "success", body: "Scorer created successfully" });
      setTimeout(() => setAlert(null), 3000);
      setCreateScorerModalOpen(false);
      void loadScorers();
    } catch (err) {
      console.error("Failed to create scorer", err);
      setAlert({ variant: "error", body: "Failed to create scorer" });
      setTimeout(() => setAlert(null), 4000);
      throw err; // Re-throw so the modal knows it failed
    }
  };

  // Legacy create submit (for simple edit modal)
  const handleCreateSubmit = async () => {
    setIsSubmitting(true);
    try {
      await deepEvalScorersService.create({
        projectId,
        name: editForm.name,
        description: editForm.description || undefined,
        metricKey: editForm.metricKey,
        type: editForm.type,
        enabled: editForm.enabled,
        defaultThreshold: editForm.defaultThreshold
          ? parseFloat(editForm.defaultThreshold)
          : undefined,
        weight: editForm.weight ? parseFloat(editForm.weight) : undefined,
        config: {
          judgeModel: editForm.judgeModel || undefined,
        },
      });
      setAlert({ variant: "success", body: "Scorer created" });
      setTimeout(() => setAlert(null), 3000);
      setEditModalOpen(false);
      void loadScorers();
    } catch (err) {
      console.error("Failed to create scorer", err);
      setAlert({ variant: "error", body: "Failed to create scorer" });
      setTimeout(() => setAlert(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination
  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newRowsPerPage = parseInt(event.target.value, 10);
      setRowsPerPage(newRowsPerPage);
      setPaginationRowCount("scorers", newRowsPerPage);
      setPage(0);
    },
    []
  );

  const getRange = useMemo(() => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(
      page * rowsPerPage + rowsPerPage,
      filteredScorers.length
    );
    return `${start} - ${end}`;
  }, [page, rowsPerPage, filteredScorers.length]);

  return (
    <Box>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      {/* Controls row */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ marginBottom: "18px" }}
        gap={2}
      >
        <Stack direction="row" alignItems="center" gap={2}>
          <FilterBy columns={filterColumns} onFilterChange={handleFilterChange} />
          <GroupBy
            options={[
              { id: "type", label: "Type" },
              { id: "metricKey", label: "Metric key" },
            ]}
            onGroupChange={() => {}}
          />
          <SearchBox
            placeholder="Search scorers..."
            value={searchTerm}
            onChange={setSearchTerm}
            inputProps={{ "aria-label": "Search scorers" }}
            fullWidth={false}
          />
        </Stack>
        <CustomizableButton
          variant="contained"
          text="New scorer"
          icon={<Plus size={16} />}
          sx={{
            backgroundColor: "#13715B",
            border: "1px solid #13715B",
            gap: 2,
          }}
          onClick={handleCreateScorer}
          isDisabled={loading}
        />
      </Stack>

      {/* Scorers table */}
      <Box mb={4}>
        <TableContainer sx={{ mt: 10 }}>
          <Table sx={{ ...singleTheme.tableStyles.primary.frame }}>
            <TableHeader columns={tableColumns} />
            {filteredScorers.length !== 0 ? (
              <>
                <TableBody>
                  {filteredScorers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((scorer) => (
                      <TableRow
                        key={scorer.id}
                        onClick={() => {
                          setEditingScorer(scorer);
                          setEditForm({
                            name: scorer.name,
                            description: scorer.description || "",
                            metricKey: scorer.metricKey,
                            type: scorer.type,
                            enabled: scorer.enabled,
                            defaultThreshold:
                              scorer.defaultThreshold != null
                                ? String(scorer.defaultThreshold)
                                : "",
                            weight: scorer.weight != null ? String(scorer.weight) : "",
                            judgeModel: scorer.config?.judgeModel || "",
                          });
                          setEditModalOpen(true);
                        }}
                        sx={{
                          ...singleTheme.tableStyles.primary.body.row,
                          "&:hover": { cursor: "pointer", backgroundColor: "#f9fafb" },
                        }}
                      >
                        <TableCell
                          sx={{
                            ...singleTheme.tableStyles.primary.body.cell,
                            paddingLeft: "12px",
                            paddingRight: "12px",
                            textTransform: "none",
                            width: "20%",
                          }}
                        >
                          {scorer.name}
                        </TableCell>
                        <TableCell
                          sx={{
                            ...singleTheme.tableStyles.primary.body.cell,
                            paddingLeft: "12px",
                            paddingRight: "12px",
                            textTransform: "none",
                          }}
                        >
                          {scorer.config?.judgeModel ||
                            scorer.config?.model ||
                            scorer.metricKey ||
                            "Scorer"}
                        </TableCell>
                        <TableCell
                          sx={{
                            ...singleTheme.tableStyles.primary.body.cell,
                            paddingLeft: "12px",
                            paddingRight: "12px",
                            textTransform: "none",
                          }}
                        >
                          {scorer.type.toUpperCase()}
                        </TableCell>
                        <TableCell
                          sx={{
                            ...singleTheme.tableStyles.primary.body.cell,
                            paddingLeft: "12px",
                            paddingRight: "12px",
                            textTransform: "none",
                          }}
                        >
                          {scorer.metricKey}
                        </TableCell>
                        <TableCell
                          sx={{
                            ...singleTheme.tableStyles.primary.body.cell,
                            paddingLeft: "12px",
                            paddingRight: "12px",
                            textTransform: "none",
                          }}
                        >
                          <StatusChip enabled={scorer.enabled} />
                        </TableCell>
                        <TableCell
                          sx={{
                            ...singleTheme.tableStyles.primary.body.cell,
                            paddingLeft: "12px",
                            paddingRight: "12px",
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuOpen(e, scorer);
                            }}
                            sx={{
                              color: theme.palette.text.secondary,
                              "&:hover": {
                                backgroundColor: theme.palette.action.hover,
                              },
                            }}
                          >
                            <Settings size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                  <TableRow
                    sx={{
                      "& .MuiTableCell-root.MuiTableCell-footer": {
                        paddingX: theme.spacing(8),
                        paddingY: theme.spacing(4),
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        fontSize: "12px",
                        color: theme.palette.text.secondary,
                        borderBottom: "none",
                      }}
                    >
                      Showing {getRange} of {filteredScorers.length} scorer
                      {filteredScorers.length !== 1 ? "s" : ""}
                    </TableCell>
                    <TablePagination
                      count={filteredScorers.length}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      rowsPerPageOptions={[5, 10, 15, 20, 25]}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      ActionsComponent={(props) => (
                        <TablePaginationActions {...props} />
                      )}
                      labelRowsPerPage="Scorers per page"
                      labelDisplayedRows={({ page: p, count }) =>
                        `Page ${p + 1} of ${Math.max(
                          0,
                          Math.ceil(count / rowsPerPage)
                        )}`
                      }
                      sx={{
                        borderBottom: "none",
                        "& .MuiTablePagination-toolbar": {
                          minHeight: "40px",
                        },
                        "& .MuiTablePagination-selectLabel": {
                          fontSize: "12px",
                          color: theme.palette.text.secondary,
                        },
                        "& .MuiTablePagination-displayedRows": {
                          fontSize: "12px",
                          color: theme.palette.text.secondary,
                        },
                      }}
                      slotProps={{
                        select: {
                          MenuProps: {
                            keepMounted: true,
                            PaperProps: {
                              sx: {
                                borderRadius: "4px",
                                boxShadow: theme.shadows[3],
                                mt: 1,
                              },
                            },
                            transformOrigin: {
                              vertical: "bottom",
                              horizontal: "left",
                            },
                            anchorOrigin: {
                              vertical: "top",
                              horizontal: "left",
                            },
                            sx: { mt: theme.spacing(-2) },
                          },
                          inputProps: { id: "pagination-dropdown" },
                          IconComponent: () => <ChevronsUpDown size={16} />,
                          sx: {
                            fontSize: "12px",
                            "& .MuiSelect-select": {
                              paddingY: "4px",
                            },
                          },
                        },
                      }}
                    />
                  </TableRow>
                </TableFooter>
              </>
            ) : (
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.length}
                    sx={{ border: "none", p: 0 }}
                  >
                    <EmptyState message="There is currently no data in this table." />
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
        </TableContainer>
      </Box>

      {/* Gear menu popover */}
      <Popover
        open={Boolean(menuAnchor)}
        anchorEl={menuAnchor}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "4px",
              boxShadow: theme.shadows[3],
              minWidth: "120px",
            },
          },
        }}
      >
        <MenuItem onClick={handleEditClick} sx={{ fontSize: "13px", py: 1 }}>
          <ListItemIcon sx={{ minWidth: "28px !important" }}>
            <Pencil size={16} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "13px" }}>
            Edit
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={handleDeleteClick}
          sx={{ fontSize: "13px", py: 1, color: "#c62828" }}
        >
          <ListItemIcon sx={{ minWidth: "28px !important", color: "#c62828" }}>
            <Trash2 size={16} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "13px" }}>
            Delete
          </ListItemText>
        </MenuItem>
      </Popover>

      {/* Edit/Create Modal */}
      <StandardModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingScorer(null);
        }}
        title={editingScorer ? "Edit scorer" : "New scorer"}
        description={
          editingScorer
            ? "Update the scorer configuration"
            : "Create a new scorer for this project"
        }
        onSubmit={editingScorer ? handleEditSubmit : handleCreateSubmit}
        submitButtonText={editingScorer ? "Save" : "Create"}
        isSubmitting={isSubmitting}
        maxWidth="600px"
      >
        <Stack spacing={6}>
          <Stack direction="row" spacing={4} sx={{ width: "100%" }}>
            <Box sx={{ flex: 1 }}>
              <Field
                label="Name"
                placeholder="Scorer name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Field
                label="Metric key"
                placeholder="e.g. answer_correctness"
                value={editForm.metricKey}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, metricKey: e.target.value }))
                }
              />
            </Box>
          </Stack>
          <Field
            label="Description"
            placeholder="Optional description"
            value={editForm.description}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, description: e.target.value }))
            }
          />
          <Stack direction="row" spacing={4} sx={{ width: "100%" }}>
            <Box sx={{ flex: 1 }}>
              <Field
                label="Type"
                placeholder="llm, builtin, custom"
                value={editForm.type}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    type: e.target.value as "llm" | "builtin" | "custom",
                  }))
                }
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Field
                label="Judge model"
                placeholder="e.g. gpt-4o-mini"
                value={editForm.judgeModel}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, judgeModel: e.target.value }))
                }
              />
            </Box>
          </Stack>
          <Stack direction="row" spacing={4} sx={{ width: "100%" }}>
            <Box sx={{ flex: 1 }}>
              <Field
                label="Default threshold"
                placeholder="0.7"
                value={editForm.defaultThreshold}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    defaultThreshold: e.target.value,
                  }))
                }
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Field
                label="Weight"
                placeholder="1.0"
                value={editForm.weight}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, weight: e.target.value }))
                }
              />
            </Box>
          </Stack>
        </Stack>
      </StandardModal>

      {/* Delete Confirmation Modal */}
      <StandardModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setScorerToDelete(null);
        }}
        title="Delete scorer"
        description={`Are you sure you want to delete "${scorerToDelete?.name || "this scorer"}"? This action cannot be undone.`}
        onSubmit={handleConfirmDelete}
        submitButtonText="Delete"
        isSubmitting={isDeleting}
        submitButtonColor="#c62828"
      />

      {/* New Comprehensive Scorer Modal */}
      <CreateScorerModal
        isOpen={createScorerModalOpen}
        onClose={() => setCreateScorerModalOpen(false)}
        onSubmit={handleNewScorerSubmit}
      />
    </Box>
  );
}
