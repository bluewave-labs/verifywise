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
  Typography,
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
import {
  getPaginationRowCount,
  setPaginationRowCount,
} from "../../../application/utils/paginationStorage";
import EmptyState from "../../components/EmptyState";
import CreateScorerModal, { type ScorerConfig } from "./CreateScorerModal";
import HelperIcon from "../../components/HelperIcon";

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

  // Edit modal state - using comprehensive CreateScorerModal
  const [editScorerModalOpen, setEditScorerModalOpen] = useState(false);
  const [editingScorer, setEditingScorer] = useState<DeepEvalScorer | null>(null);
  const [editInitialConfig, setEditInitialConfig] = useState<Partial<ScorerConfig> | undefined>(undefined);

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
      try {
        const scorerConfig = typeof menuScorer.config === 'object' && menuScorer.config !== null ? menuScorer.config : {};
        
        // Convert scorer to ScorerConfig format for the comprehensive modal
        const judgeModel = scorerConfig.judgeModel;
        const provider = typeof judgeModel === 'object' ? judgeModel?.provider : scorerConfig.provider || "openai";
        const model = typeof judgeModel === 'object' ? judgeModel?.name : (typeof judgeModel === 'string' ? judgeModel : scorerConfig.model || "");
        const modelParams = typeof judgeModel === 'object' && judgeModel?.params ? {
          temperature: judgeModel.params.temperature ?? 0,
          maxTokens: judgeModel.params.max_tokens ?? 256,
          topP: judgeModel.params.top_p ?? 1,
        } : scorerConfig.modelParams || { temperature: 0, maxTokens: 256, topP: 1 };
        
        setEditInitialConfig({
          name: menuScorer.name || "",
          slug: menuScorer.metricKey || "",
          provider: provider || "",
          model: model || "",
          modelParams,
          messages: scorerConfig.messages || [{ role: "system", content: "You are a helpful assistant" }],
          useChainOfThought: scorerConfig.useChainOfThought ?? true,
          choiceScores: scorerConfig.choiceScores || [{ label: "", score: 0 }],
          passThreshold: menuScorer.defaultThreshold ?? 0.5,
        });
        
        setEditingScorer(menuScorer);
        setEditScorerModalOpen(true);
      } catch (err) {
        console.error("Error opening scorer edit modal:", err);
        setAlert({ variant: "error", body: "Failed to open scorer for editing" });
        setTimeout(() => setAlert(null), 4000);
      }
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

  // Edit scorer submit (using comprehensive modal)
  const handleEditScorerSubmit = async (config: ScorerConfig) => {
    if (!editingScorer) return;
    try {
      await deepEvalScorersService.update(editingScorer.id, {
        name: config.name,
        description: `LLM scorer using ${config.provider}/${config.model}`,
        metricKey: config.slug,
        type: "llm",
        enabled: true,
        defaultThreshold: config.passThreshold,
        weight: 1.0,
        config: {
          provider: config.provider,
          judgeModel: {
            name: config.model,
            provider: config.provider,
            params: {
              temperature: config.modelParams.temperature,
              max_tokens: config.modelParams.maxTokens,
              top_p: config.modelParams.topP,
            },
          },
          messages: config.messages,
          useChainOfThought: config.useChainOfThought,
          choiceScores: config.choiceScores,
          inputSchema: config.inputSchema,
          modelParams: config.modelParams,
        },
      });
      setAlert({ variant: "success", body: "Scorer updated successfully" });
      setTimeout(() => setAlert(null), 3000);
      setEditScorerModalOpen(false);
      setEditingScorer(null);
      setEditInitialConfig(undefined);
      void loadScorers();
    } catch (err) {
      console.error("Failed to update scorer", err);
      setAlert({ variant: "error", body: "Failed to update scorer" });
      setTimeout(() => setAlert(null), 4000);
      throw err; // Re-throw so modal knows it failed
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
        description: `LLM scorer using ${config.provider}/${config.model}`,
        metricKey: config.slug,
        type: "llm",
        enabled: true,
        defaultThreshold: config.passThreshold,
        weight: 1.0,
        config: {
          provider: config.provider,
          judgeModel: {
            provider: config.provider,
            name: config.model,
            params: {
              temperature: config.modelParams.temperature,
              max_tokens: config.modelParams.maxTokens,
              top_p: config.modelParams.topP,
            },
          },
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

      {/* Header + description */}
      <Stack spacing={1} mb={4}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" fontSize={15} fontWeight="600" color="#111827">
            Scorers
          </Typography>
          <HelperIcon articlePath="llm-evals/configuring-scorers" />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: "14px" }}>
          Define custom LLM judges to evaluate model outputs using your own domain-specific criteria and prompts.
        </Typography>
      </Stack>

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
        <TableContainer>
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
                          try {
                            const scorerConfig = typeof scorer.config === 'object' && scorer.config !== null ? scorer.config : {};
                            // Convert scorer to ScorerConfig format for comprehensive modal
                            const judgeModel = scorerConfig.judgeModel;
                            const provider = typeof judgeModel === 'object' ? judgeModel?.provider : scorerConfig.provider || "openai";
                            const model = typeof judgeModel === 'object' ? judgeModel?.name : (typeof judgeModel === 'string' ? judgeModel : scorerConfig.model || "");
                            const modelParams = typeof judgeModel === 'object' && judgeModel?.params ? {
                              temperature: judgeModel.params.temperature ?? 0,
                              maxTokens: judgeModel.params.max_tokens ?? 256,
                              topP: judgeModel.params.top_p ?? 1,
                            } : scorerConfig.modelParams || { temperature: 0, maxTokens: 256, topP: 1 };
                            
                            setEditInitialConfig({
                              name: scorer.name || "",
                              slug: scorer.metricKey || "",
                              provider: provider || "",
                              model: model || "",
                              modelParams,
                              messages: scorerConfig.messages || [{ role: "system", content: "You are a helpful assistant" }],
                              useChainOfThought: scorerConfig.useChainOfThought ?? true,
                              choiceScores: scorerConfig.choiceScores || [{ label: "", score: 0 }],
                              passThreshold: scorer.defaultThreshold ?? 0.5,
                              inputSchema: scorerConfig.inputSchema || `{
                                "input": "",
                                "output": "",
                                "expected": "",
                                "metadata": {}
                              }`,
                            });
                            setEditingScorer(scorer);
                            setEditScorerModalOpen(true);
                          } catch (err) {
                            console.error("Error opening scorer edit modal:", err);
                          }
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
                          {/* judgeModel can be string or object {name, params, provider} */}
                          {typeof scorer.config?.judgeModel === 'string' 
                            ? scorer.config.judgeModel 
                            : scorer.config?.judgeModel?.name ||
                              (typeof scorer.config?.model === 'string' 
                                ? scorer.config.model 
                                : scorer.config?.model?.name) ||
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

      {/* Edit Scorer Modal - uses comprehensive CreateScorerModal */}
      <CreateScorerModal
        isOpen={editScorerModalOpen}
        onClose={() => {
          setEditScorerModalOpen(false);
          setEditingScorer(null);
          setEditInitialConfig(undefined);
        }}
        onSubmit={handleEditScorerSubmit}
        initialConfig={editInitialConfig}
        projectId={projectId}
      />

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
        projectId={projectId}
      />
    </Box>
  );
}
