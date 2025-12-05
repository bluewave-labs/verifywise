import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Drawer,
  Divider,
  Chip,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  TablePagination,
  Button,
  useTheme,
  IconButton,
  Popover,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Database, Upload, Download, X, MoreVertical, Eye, Edit3, Trash2, ArrowLeft, Save as SaveIcon, Plus } from "lucide-react";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { deepEvalDatasetsService, type DatasetPromptRecord, type ListedDataset } from "../../../infrastructure/api/deepEvalDatasetsService";
import Alert from "../../components/Alert";
import ModalStandard from "../../components/Modals/StandardModal";
import DualButtonModal from "../../components/Dialogs/DualButtonModal";
import Field from "../../components/Inputs/Field";
import SearchBox from "../../components/Search/SearchBox";
import { FilterBy, type FilterColumn } from "../../components/Table/FilterBy";
import { GroupBy } from "../../components/Table/GroupBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";
import singleTheme from "../../themes/v1SingleTheme";
import TablePaginationActions from "../../components/TablePagination";
import { getPaginationRowCount, setPaginationRowCount } from "../../../application/utils/paginationStorage";

type ProjectDatasetsProps = { projectId: string };

type DatasetType = "built-in" | "custom" | "benchmark";

type BuiltInDataset = ListedDataset & {
  promptCount?: number;
  isUserDataset?: boolean;
  createdAt?: string;
  datasetType?: DatasetType;
  description?: string;
  sampleCount?: number;
};

// DeepEval standard benchmarks
const DEEPEVAL_BENCHMARKS: BuiltInDataset[] = [
  {
    key: "benchmark_mmlu",
    name: "MMLU",
    path: "benchmark://mmlu",
    use_case: "chatbot" as const,
    datasetType: "benchmark",
    description: "Massive Multitask Language Understanding - 57 subjects",
    sampleCount: 14042,
  },
  {
    key: "benchmark_hellaswag",
    name: "HellaSwag",
    path: "benchmark://hellaswag",
    use_case: "chatbot" as const,
    datasetType: "benchmark",
    description: "Commonsense reasoning about physical situations",
    sampleCount: 10042,
  },
  {
    key: "benchmark_truthfulqa",
    name: "TruthfulQA",
    path: "benchmark://truthfulqa",
    use_case: "chatbot" as const,
    datasetType: "benchmark",
    description: "Measuring truthfulness in language models",
    sampleCount: 817,
  },
  {
    key: "benchmark_gsm8k",
    name: "GSM8K",
    path: "benchmark://gsm8k",
    use_case: "chatbot" as const,
    datasetType: "benchmark",
    description: "Grade school math word problems",
    sampleCount: 8792,
  },
  {
    key: "benchmark_arc",
    name: "ARC",
    path: "benchmark://arc",
    use_case: "chatbot" as const,
    datasetType: "benchmark",
    description: "AI2 Reasoning Challenge - science questions",
    sampleCount: 7787,
  },
  {
    key: "benchmark_winogrande",
    name: "WinoGrande",
    path: "benchmark://winogrande",
    use_case: "chatbot" as const,
    datasetType: "benchmark",
    description: "Commonsense reasoning - pronoun resolution",
    sampleCount: 44000,
  },
  {
    key: "benchmark_drop",
    name: "DROP",
    path: "benchmark://drop",
    use_case: "rag" as const,
    datasetType: "benchmark",
    description: "Discrete reasoning over paragraphs",
    sampleCount: 96567,
  },
  {
    key: "benchmark_humaneval",
    name: "HumanEval",
    path: "benchmark://humaneval",
    use_case: "agent" as const,
    datasetType: "benchmark",
    description: "Python coding problems",
    sampleCount: 164,
  },
  {
    key: "benchmark_bigbench",
    name: "Big-Bench Hard",
    path: "benchmark://bigbench",
    use_case: "chatbot" as const,
    datasetType: "benchmark",
    description: "Challenging tasks from BIG-Bench",
    sampleCount: 6511,
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ProjectDatasets(_props: ProjectDatasetsProps) {
  const theme = useTheme();
  const [datasets, setDatasets] = useState<BuiltInDataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => getPaginationRowCount("datasets", 10));
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<BuiltInDataset | null>(null);
  const [datasetPrompts, setDatasetPrompts] = useState<DatasetPromptRecord[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  // Action menu state
  const [actionAnchor, setActionAnchor] = useState<HTMLElement | null>(null);
  const [actionDataset, setActionDataset] = useState<BuiltInDataset | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState<BuiltInDataset | null>(null);

  // Inline editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState<BuiltInDataset | null>(null);
  const [editablePrompts, setEditablePrompts] = useState<DatasetPromptRecord[]>([]);
  const [editDatasetName, setEditDatasetName] = useState("");
  const [savingDataset, setSavingDataset] = useState(false);
  const [loadingEditor, setLoadingEditor] = useState(false);

  // Prompt edit drawer state (for inline editor)
  const [promptDrawerOpen, setPromptDrawerOpen] = useState(false);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number | null>(null);

  const loadDatasets = useCallback(async () => {
    try {
      setLoading(true);
      // Load both built-in datasets and user-uploaded datasets
      const [builtInRes, userRes] = await Promise.all([
        deepEvalDatasetsService.list(),
        deepEvalDatasetsService.listMy().catch(() => ({ datasets: [] })),
      ]);

      // Flatten all built-in categories into a single array
      const allDatasets: BuiltInDataset[] = [];
      
      // Add user-uploaded datasets first (custom type)
      const userDatasets = userRes.datasets || [];
      userDatasets.forEach((ud) => {
        allDatasets.push({
          key: `user_${ud.id}`,
          name: ud.name,
          path: ud.path,
          use_case: "chatbot" as const,
          isUserDataset: true,
          datasetType: "custom",
          createdAt: ud.createdAt,
        });
      });

      // Add built-in datasets
      (["chatbot", "rag", "agent", "safety"] as const).forEach((category) => {
        const categoryDatasets = builtInRes[category] || [];
        categoryDatasets.forEach((ds) => {
          allDatasets.push({ ...ds, isUserDataset: false, datasetType: "built-in" });
        });
      });

      // Add benchmarks
      DEEPEVAL_BENCHMARKS.forEach((benchmark) => {
        allDatasets.push(benchmark);
      });

      setDatasets(allDatasets);
    } catch (err) {
      console.error("Failed to load datasets", err);
      setDatasets([]);
      setAlert({
        variant: "error",
        body: "Failed to load datasets",
      });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDatasets();
  }, [loadDatasets]);

  const filterColumns: FilterColumn[] = useMemo(
    () => [
      { id: "name", label: "Dataset name", type: "text" },
      { id: "datasetType", label: "Type", type: "select", options: [
        { value: "built-in", label: "Built-in" },
        { value: "custom", label: "Custom" },
        { value: "benchmark", label: "Benchmark" },
      ]},
      { id: "use_case", label: "Use case", type: "select", options: [
        { value: "chatbot", label: "Chatbot" },
        { value: "rag", label: "RAG" },
        { value: "agent", label: "Agent" },
        { value: "safety", label: "Safety" },
      ]},
    ],
    []
  );

  const getFieldValue = useCallback(
    (d: BuiltInDataset, fieldId: string): string | number | Date | null | undefined => {
      switch (fieldId) {
        case "name":
          return d.name;
        case "use_case":
          return d.use_case;
        case "datasetType":
          return d.datasetType;
        default:
          return "";
      }
    },
    []
  );

  const { filterData, handleFilterChange } = useFilterBy<BuiltInDataset>(getFieldValue);

  const filteredDatasets = useMemo(() => {
    const afterFilter = filterData(datasets);
    if (!searchTerm.trim()) return afterFilter;
    const q = searchTerm.toLowerCase();
    return afterFilter.filter((d) =>
      [d.name, d.path, d.use_case].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [datasets, filterData, searchTerm]);

  // Action menu handlers
  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, dataset: BuiltInDataset) => {
    event.stopPropagation();
    setActionAnchor(event.currentTarget);
    setActionDataset(dataset);
  };

  const handleActionMenuClose = () => {
    setActionAnchor(null);
    setActionDataset(null);
  };

  const handleViewPrompts = async (dataset: BuiltInDataset) => {
    handleActionMenuClose();
    setSelectedDataset(dataset);
    setDrawerOpen(true);
    try {
      setLoadingPrompts(true);
      const res = await deepEvalDatasetsService.read(dataset.path);
      setDatasetPrompts(res.prompts || []);
    } catch (err) {
      console.error("Failed to load dataset prompts", err);
      setDatasetPrompts([]);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const handleOpenInEditor = async (dataset: BuiltInDataset) => {
    handleActionMenuClose();
    try {
      setLoadingEditor(true);
      const res = await deepEvalDatasetsService.read(dataset.path);
      setEditablePrompts(res.prompts || []);
      // Derive name from path
      const base = dataset.path.split("/").pop() || "dataset";
      const derivedName = base.replace(/\.json$/i, "").replace(/[_-]+/g, " ").replace(/^\d+\s+/, "");
      setEditDatasetName(derivedName);
      setEditingDataset(dataset);
      setEditorOpen(true);
    } catch (err) {
      console.error("Failed to load dataset for editing", err);
      setAlert({ variant: "error", body: "Failed to load dataset for editing" });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setLoadingEditor(false);
    }
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingDataset(null);
    setEditablePrompts([]);
    setEditDatasetName("");
  };

  const handleSaveDataset = async () => {
    try {
      setSavingDataset(true);
      const json = JSON.stringify(editablePrompts, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const slug = editDatasetName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      const finalName = slug ? `${slug}.json` : "dataset.json";
      const file = new File([blob], finalName, { type: "application/json" });
      await deepEvalDatasetsService.uploadDataset(file);
      setAlert({ variant: "success", body: `Dataset "${editDatasetName}" saved successfully!` });
      setTimeout(() => setAlert(null), 3000);
      handleCloseEditor();
      void loadDatasets();
    } catch (err) {
      console.error("Failed to save dataset", err);
      type AxiosLike = { response?: { data?: unknown } };
      const axiosErr = err as AxiosLike | Error;
      const resData = (axiosErr as AxiosLike)?.response?.data as Record<string, unknown> | undefined;
      const serverMsg =
        (resData && (String(resData.message ?? "") || String(resData.detail ?? ""))) ||
        (axiosErr instanceof Error ? axiosErr.message : null);
      setAlert({ variant: "error", body: serverMsg || "Save failed. Check dataset structure." });
      setTimeout(() => setAlert(null), 6000);
    } finally {
      setSavingDataset(false);
    }
  };

  const isValidToSave = useMemo(() => editablePrompts && editablePrompts.length > 0 && editDatasetName.trim(), [editablePrompts, editDatasetName]);

  const handleRemoveDataset = (dataset: BuiltInDataset) => {
    handleActionMenuClose();
    setDatasetToDelete(dataset);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!datasetToDelete) return;
    try {
      await deepEvalDatasetsService.deleteDatasets([datasetToDelete.path]);
      setAlert({ variant: "success", body: "Dataset removed" });
      setTimeout(() => setAlert(null), 3000);
      void loadDatasets();
    } catch (err) {
      console.error("Failed to remove dataset", err);
      setAlert({ variant: "error", body: "Failed to remove dataset" });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setDeleteModalOpen(false);
      setDatasetToDelete(null);
    }
  };

  const handleRowClick = async (dataset: BuiltInDataset) => {
    // Open drawer when clicking on a row
    await handleViewPrompts(dataset);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPaginationRowCount("datasets", newRowsPerPage);
    setPage(0);
  };

  // Paginated datasets
  const paginatedDatasets = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredDatasets.slice(start, start + rowsPerPage);
  }, [filteredDatasets, page, rowsPerPage]);

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedDataset(null);
    setDatasetPrompts([]);
  };

  const handleUploadClick = () => {
    setUploadModalOpen(true);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadExample = () => {
    const exampleData = [
      {
        id: "example_001",
        category: "general_knowledge",
        prompt: "What is the capital of France?",
        expected_output: "The capital of France is Paris.",
        expected_keywords: ["Paris", "capital", "France"],
        difficulty: "easy",
        retrieval_context: ["France is a country in Western Europe. Its capital city is Paris, which is also the largest city in France."]
      },
      {
        id: "example_002",
        category: "coding",
        prompt: "Write a Python function to reverse a string.",
        expected_output: "def reverse_string(s):\n    return s[::-1]",
        expected_keywords: ["def", "return", "[::-1]"],
        difficulty: "medium"
      }
    ];

    const blob = new Blob([JSON.stringify(exampleData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "example_dataset.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadModalOpen(false);
      const resp = await deepEvalDatasetsService.uploadDataset(file);
      setAlert({ variant: "success", body: `Uploaded ${resp.filename}` });
      setTimeout(() => setAlert(null), 4000);
      void loadDatasets();
    } catch (err) {
      console.error("Upload failed", err);
      setAlert({
        variant: "error",
        body: err instanceof Error ? err.message : "Upload failed",
      });
      setTimeout(() => setAlert(null), 6000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // If editor is loading, show spinner
  if (loadingEditor) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress sx={{ color: "#13715B" }} />
      </Box>
    );
  }

  // Inline editor view
  if (editorOpen && editingDataset) {
    return (
      <Box>
        {alert && <Alert variant={alert.variant} body={alert.body} />}

        {/* Header with back button and save */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton size="small" onClick={handleCloseEditor} aria-label="Back">
              <ArrowLeft size={18} />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "16px" }}>
              Edit dataset
            </Typography>
          </Stack>
          <Button
            variant="contained"
            disabled={!isValidToSave || savingDataset}
            sx={{ bgcolor: "#13715B", "&:hover": { bgcolor: "#0F5E4B" }, height: "34px" }}
            startIcon={<SaveIcon size={16} />}
            onClick={handleSaveDataset}
          >
            {savingDataset ? "Saving..." : "Save copy"}
          </Button>
        </Stack>

        {/* Dataset name input */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Field
            label="Dataset name"
            value={editDatasetName}
            onChange={(e) => setEditDatasetName(e.target.value)}
            placeholder="Enter a descriptive name for this dataset"
            isRequired
          />
          <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "13px" }}>
            Edit the prompts below, then click Save to add a copy to your datasets.
          </Typography>
        </Stack>

        {/* Prompts table */}
        <TableContainer>
          <Table sx={singleTheme.tableStyles.primary.frame}>
            <TableHead sx={{ backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors }}>
              <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "80px" }}>ID</TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Prompt</TableCell>
                <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "100px" }}>Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {editablePrompts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No prompts found in this dataset.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                editablePrompts.map((p, idx) => (
                  <TableRow
                    key={p.id || idx}
                    onClick={() => {
                      setSelectedPromptIndex(idx);
                      setPromptDrawerOpen(true);
                    }}
                    sx={{
                      ...singleTheme.tableStyles.primary.body.row,
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "#f5f5f5" },
                    }}
                  >
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Typography sx={{ fontSize: "12px", fontFamily: "monospace", color: "#6B7280" }}>
                        {p.id || `prompt_${idx + 1}`}
                      </Typography>
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {p.prompt}
                      </Typography>
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Chip
                        label={p.category || "uncategorized"}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "11px",
                          backgroundColor: "#E5E7EB",
                          color: "#374151",
                          borderRadius: "4px",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Prompt Edit Drawer */}
        <Drawer
          anchor="right"
          open={promptDrawerOpen}
          onClose={() => {
            setPromptDrawerOpen(false);
            setSelectedPromptIndex(null);
          }}
        >
          <Stack
            sx={{
              width: 500,
              maxHeight: "100vh",
              overflowY: "auto",
              p: theme.spacing(10),
              bgcolor: theme.palette.background.paper,
            }}
          >
            {/* Drawer Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography fontWeight={600} color={theme.palette.text.primary} fontSize="16px">
                Edit prompt
              </Typography>
              <Box
                onClick={() => {
                  setPromptDrawerOpen(false);
                  setSelectedPromptIndex(null);
                }}
                sx={{ cursor: "pointer" }}
              >
                <X size={20} color={theme.palette.text.secondary} />
              </Box>
            </Stack>
            <Divider sx={{ mb: 3, mx: `calc(-1 * ${theme.spacing(10)})` }} />

            {selectedPromptIndex !== null && editablePrompts[selectedPromptIndex] && (
              <Stack spacing={3}>
                <Field
                  label="Prompt"
                  value={editablePrompts[selectedPromptIndex].prompt}
                  onChange={(e) => {
                    const next = [...editablePrompts];
                    next[selectedPromptIndex] = { ...next[selectedPromptIndex], prompt: e.target.value };
                    setEditablePrompts(next);
                  }}
                  placeholder="Enter the prompt text"
                  isRequired
                  type="description"
                />

                <Field
                  label="Expected output"
                  value={editablePrompts[selectedPromptIndex].expected_output || ""}
                  onChange={(e) => {
                    const next = [...editablePrompts];
                    next[selectedPromptIndex] = { ...next[selectedPromptIndex], expected_output: e.target.value };
                    setEditablePrompts(next);
                  }}
                  placeholder="Enter the expected response"
                  type="description"
                />

                <Field
                  label="Keywords"
                  value={(editablePrompts[selectedPromptIndex].expected_keywords || []).join(", ")}
                  onChange={(e) => {
                    const value = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                    const next = [...editablePrompts];
                    next[selectedPromptIndex] = { ...next[selectedPromptIndex], expected_keywords: value };
                    setEditablePrompts(next);
                  }}
                  placeholder="Comma separated keywords"
                />

                <Field
                  label="Retrieval context"
                  value={(editablePrompts[selectedPromptIndex].retrieval_context || []).join("\n")}
                  onChange={(e) => {
                    const lines = e.target.value.split("\n");
                    const next = [...editablePrompts];
                    next[selectedPromptIndex] = { ...next[selectedPromptIndex], retrieval_context: lines };
                    setEditablePrompts(next);
                  }}
                  placeholder="One entry per line"
                  type="description"
                />

                <Button
                  variant="contained"
                  onClick={() => {
                    setPromptDrawerOpen(false);
                    setSelectedPromptIndex(null);
                  }}
                  sx={{
                    bgcolor: "#13715B",
                    "&:hover": { bgcolor: "#0F5E4B" },
                    height: "34px",
                    mt: 2,
                  }}
                >
                  Done
                </Button>
              </Stack>
            )}
          </Stack>
        </Drawer>
      </Box>
    );
  }

  // Default table view
  return (
    <Box>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={handleFileChange}
      />

      {/* Filters + search + action buttons */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ marginBottom: "18px" }} gap={2}>
        <Stack direction="row" alignItems="center" gap={2}>
          <FilterBy columns={filterColumns} onFilterChange={handleFilterChange} />
          <GroupBy
            options={[
              { id: "name", label: "Name" },
              { id: "prompts", label: "Prompts" },
              { id: "createdAt", label: "Created" },
            ]}
            onGroupChange={() => {
              /* Grouping behaviour can be added later */
            }}
          />
          <SearchBox
            placeholder="Search datasets..."
            value={searchTerm}
            onChange={setSearchTerm}
            inputProps={{ "aria-label": "Search datasets" }}
            fullWidth={false}
          />
        </Stack>
        <Stack direction="row" spacing={2}>
          <CustomizableButton
            variant="outlined"
            text={uploading ? "Uploading..." : "Upload dataset"}
            icon={<Upload size={16} />}
            onClick={handleUploadClick}
            isDisabled={uploading}
            sx={{
              border: "1px solid #d0d5dd",
              color: "#344054",
              gap: 2,
            }}
          />
          <CustomizableButton
            variant="contained"
            text="Create dataset"
            icon={<Plus size={16} />}
            onClick={() => {
              // Open editor with empty dataset
              setEditablePrompts([{
                id: "prompt_1",
                category: "general",
                prompt: "",
                expected_output: "",
              }]);
              setEditDatasetName("");
              setEditingDataset({ key: "new", name: "New Dataset", path: "", use_case: "chatbot" });
              setEditorOpen(true);
            }}
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              gap: 2,
            }}
          />
        </Stack>
      </Stack>

      {/* Table of datasets */}
      <Box mb={4}>
        <TableContainer>
          <Table sx={singleTheme.tableStyles.primary.frame}>
            <TableHead sx={{ backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors }}>
              <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                <TableCell sx={singleTheme.tableStyles.primary.header.cell}>DATASET</TableCell>
                <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, textAlign: "center" }}>TYPE</TableCell>
                <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, textAlign: "center" }}>USE CASE</TableCell>
                <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, textAlign: "center" }}>DESCRIPTION</TableCell>
                <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "60px" }}>ACTION</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: "center", py: 4 }}>
                    <CircularProgress size={24} sx={{ color: "#13715B" }} />
                  </TableCell>
                </TableRow>
              ) : paginatedDatasets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No datasets found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDatasets.map((dataset) => {
                  const typeLabel = dataset.datasetType === "benchmark" ? "Benchmark" :
                                   dataset.datasetType === "custom" ? "Custom" : "Built-in";
                  const typeColors = dataset.datasetType === "benchmark"
                    ? { bg: "#FEF3C7", color: "#92400E" }
                    : dataset.datasetType === "custom"
                    ? { bg: "#DBEAFE", color: "#1E40AF" }
                    : { bg: "#D1FAE5", color: "#065F46" };

                  return (
                    <TableRow
                      key={dataset.key || dataset.path}
                      onClick={() => dataset.datasetType !== "benchmark" && handleRowClick(dataset)}
                      sx={{
                        ...singleTheme.tableStyles.primary.body.row,
                        cursor: dataset.datasetType === "benchmark" ? "default" : "pointer",
                        "&:hover": { backgroundColor: "#f5f5f5" },
                      }}
                    >
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>{dataset.name}</Typography>
                      </TableCell>
                      <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, textAlign: "center" }}>
                        <Chip
                          label={typeLabel}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "11px",
                            backgroundColor: typeColors.bg,
                            color: typeColors.color,
                            borderRadius: "4px",
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, textAlign: "center" }}>
                        <Chip
                          label={dataset.use_case.charAt(0).toUpperCase() + dataset.use_case.slice(1)}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: "11px",
                            backgroundColor: "#E5E7EB",
                            color: "#374151",
                            borderRadius: "4px",
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, maxWidth: "350px", textAlign: "center" }}>
                        <Typography
                          sx={{
                            fontSize: "12px",
                            color: dataset.description ? "#6B7280" : "#9CA3AF",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "100%",
                          }}
                          title={dataset.description || undefined}
                        >
                          {dataset.description || "-"}
                        </Typography>
                        {dataset.sampleCount && (
                          <Typography sx={{ fontSize: "11px", color: "#9CA3AF", mt: 0.5 }}>
                            {dataset.sampleCount.toLocaleString()} samples
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell
                        sx={singleTheme.tableStyles.primary.body.cell}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {dataset.datasetType !== "benchmark" && (
                          <IconButton
                            size="small"
                            onClick={(e) => handleActionMenuOpen(e, dataset)}
                            sx={{ padding: "4px" }}
                          >
                            <MoreVertical size={16} color="#6B7280" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            {filteredDatasets.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    count={filteredDatasets.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    ActionsComponent={TablePaginationActions}
                    sx={{
                      borderBottom: "none",
                      "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                        fontSize: "12px",
                      },
                    }}
                  />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>
      </Box>

      {/* Action menu popover */}
      <Popover
        open={Boolean(actionAnchor)}
        anchorEl={actionAnchor}
        onClose={handleActionMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "4px",
              border: "1px solid #d0d5dd",
              boxShadow: "0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)",
              minWidth: "160px",
            },
          },
        }}
      >
        <List disablePadding>
          <ListItemButton
            onClick={() => actionDataset && handleViewPrompts(actionDataset)}
            sx={{ py: 1, px: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Eye size={16} color="#374151" />
            </ListItemIcon>
            <ListItemText
              primary="View prompts"
              primaryTypographyProps={{ fontSize: "13px", color: "#374151" }}
            />
          </ListItemButton>
          <ListItemButton
            onClick={() => actionDataset && handleOpenInEditor(actionDataset)}
            sx={{ py: 1, px: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Edit3 size={16} color="#374151" />
            </ListItemIcon>
            <ListItemText
              primary="Open in editor"
              primaryTypographyProps={{ fontSize: "13px", color: "#374151" }}
            />
          </ListItemButton>
          <ListItemButton
            onClick={() => actionDataset && handleRemoveDataset(actionDataset)}
            sx={{ py: 1, px: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Trash2 size={16} color="#DC2626" />
            </ListItemIcon>
            <ListItemText
              primary="Remove dataset"
              primaryTypographyProps={{ fontSize: "13px", color: "#DC2626" }}
            />
          </ListItemButton>
        </List>
      </Popover>

      {/* Delete confirmation modal */}
      <DualButtonModal
        isOpen={deleteModalOpen}
        title="Delete this dataset?"
        body={`Are you sure you want to remove "${datasetToDelete?.name || "this dataset"}" from your project? This action cannot be undone.`}
        cancelText="Cancel"
        proceedText="Delete"
        onCancel={() => {
          setDeleteModalOpen(false);
          setDatasetToDelete(null);
        }}
        onProceed={handleConfirmDelete}
        proceedButtonColor="error"
        proceedButtonVariant="contained"
      />

      {/* Upload instructions modal */}
      <ModalStandard
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload dataset"
        description="Upload a custom dataset in JSON format"
        onSubmit={handleFileSelect}
        submitButtonText="Choose file"
        isSubmitting={false}
      >
        <Stack spacing={3}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: "13px" }}>
                Required JSON structure
              </Typography>
              <Button
                size="small"
                startIcon={<Download size={14} />}
                onClick={handleDownloadExample}
                sx={{
                  textTransform: "none",
                  fontSize: "12px",
                  color: "#13715B",
                  "&:hover": {
                    backgroundColor: "rgba(19, 113, 91, 0.08)",
                  },
                }}
              >
                Download example
              </Button>
            </Box>
            <Box
              sx={{
                backgroundColor: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: "6px",
                p: 2,
                fontFamily: "monospace",
                fontSize: "12px",
                overflow: "auto",
              }}
            >
              <pre style={{ margin: 0 }}>
{`[
  {
    "id": "unique_id",
    "category": "category_name",
    "prompt": "The question or prompt",
    "expected_output": "Expected response",
    "expected_keywords": ["optional", "keywords"],
    "difficulty": "easy|medium|hard",
    "retrieval_context": ["optional", "for RAG"]
  }
]`}
              </pre>
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: "13px", mb: 1 }}>
              Field descriptions
            </Typography>
            <Stack spacing={1}>
              <Box>
                <Typography component="span" sx={{ fontSize: "12px", fontWeight: 600, fontFamily: "monospace" }}>
                  id
                </Typography>
                <Typography component="span" sx={{ fontSize: "12px", color: "text.secondary", ml: 1 }}>
                  (required) Unique identifier for the test case
                </Typography>
              </Box>
              <Box>
                <Typography component="span" sx={{ fontSize: "12px", fontWeight: 600, fontFamily: "monospace" }}>
                  category
                </Typography>
                <Typography component="span" sx={{ fontSize: "12px", color: "text.secondary", ml: 1 }}>
                  (required) Category or topic of the test
                </Typography>
              </Box>
              <Box>
                <Typography component="span" sx={{ fontSize: "12px", fontWeight: 600, fontFamily: "monospace" }}>
                  prompt
                </Typography>
                <Typography component="span" sx={{ fontSize: "12px", color: "text.secondary", ml: 1 }}>
                  (required) The input question or prompt
                </Typography>
              </Box>
              <Box>
                <Typography component="span" sx={{ fontSize: "12px", fontWeight: 600, fontFamily: "monospace" }}>
                  expected_output
                </Typography>
                <Typography component="span" sx={{ fontSize: "12px", color: "text.secondary", ml: 1 }}>
                  (required) The expected model response
                </Typography>
              </Box>
              <Box>
                <Typography component="span" sx={{ fontSize: "12px", fontWeight: 600, fontFamily: "monospace" }}>
                  expected_keywords
                </Typography>
                <Typography component="span" sx={{ fontSize: "12px", color: "text.secondary", ml: 1 }}>
                  (optional) Keywords that should appear in the response
                </Typography>
              </Box>
              <Box>
                <Typography component="span" sx={{ fontSize: "12px", fontWeight: 600, fontFamily: "monospace" }}>
                  difficulty
                </Typography>
                <Typography component="span" sx={{ fontSize: "12px", color: "text.secondary", ml: 1 }}>
                  (optional) Difficulty level: easy, medium, or hard
                </Typography>
              </Box>
              <Box>
                <Typography component="span" sx={{ fontSize: "12px", fontWeight: 600, fontFamily: "monospace" }}>
                  retrieval_context
                </Typography>
                <Typography component="span" sx={{ fontSize: "12px", color: "text.secondary", ml: 1 }}>
                  (optional) Context documents for RAG evaluations
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </ModalStandard>

      {/* Dataset Content Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={handleCloseDrawer}>
        <Stack
          sx={{
            width: 700,
            maxHeight: "100vh",
            overflowY: "auto",
            p: theme.spacing(10),
            bgcolor: theme.palette.background.paper,
          }}
        >
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Database size={18} color="#13715B" />
              <Typography fontWeight={600} color={theme.palette.text.primary}>
                {selectedDataset?.name || "Dataset"}
              </Typography>
              {datasetPrompts.length > 0 && (
                <Chip
                  label={`${datasetPrompts.length} prompts`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "11px",
                    backgroundColor: "#E5E7EB",
                    color: "#374151",
                    borderRadius: "4px",
                  }}
                />
              )}
            </Stack>
            <Box onClick={handleCloseDrawer} sx={{ cursor: "pointer" }}>
              <X size={20} color={theme.palette.text.secondary} />
            </Box>
          </Stack>
          <Divider sx={{ mb: 4, mx: `calc(-1 * ${theme.spacing(10)})` }} />

          {/* Loading State */}
          {loadingPrompts && (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
              <CircularProgress size={32} sx={{ color: "#13715B" }} />
            </Box>
          )}

          {/* Empty State */}
          {!loadingPrompts && datasetPrompts.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="body2" color="text.secondary">
                No prompts found in this dataset.
              </Typography>
            </Box>
          )}

          {/* Dataset Prompts Table */}
          {!loadingPrompts && datasetPrompts.length > 0 && (
            <TableContainer>
              <Table sx={{ ...singleTheme.tableStyles.primary.frame, tableLayout: "fixed" }}>
                <TableHead
                  sx={{
                    backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors,
                  }}
                >
                  <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                    <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "80px" }}>
                      ID
                    </TableCell>
                    <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "100px" }}>
                      Category
                    </TableCell>
                    <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "360px" }}>
                      Prompt
                    </TableCell>
                    <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "80px" }}>
                      Difficulty
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datasetPrompts.map((prompt: DatasetPromptRecord, index: number) => (
                    <TableRow
                      key={prompt.id || index}
                      sx={singleTheme.tableStyles.primary.body.row}
                    >
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        <Typography sx={{ fontSize: "12px", fontFamily: "monospace", color: "#6B7280" }}>
                          {prompt.id}
                        </Typography>
                      </TableCell>
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        <Chip
                          label={prompt.category}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: "11px",
                            backgroundColor: "#E5E7EB",
                            color: "#374151",
                            borderRadius: "4px",
                          }}
                        />
                      </TableCell>
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        <Typography
                          sx={{
                            fontSize: "13px",
                            color: theme.palette.text.primary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {prompt.prompt}
                        </Typography>
                      </TableCell>
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        {prompt.difficulty && (
                          <Chip
                            label={prompt.difficulty}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "10px",
                              fontWeight: 500,
                              backgroundColor:
                                prompt.difficulty === "easy" ? "#D1FAE5" :
                                prompt.difficulty === "medium" ? "#FEF3C7" :
                                prompt.difficulty === "hard" ? "#FEE2E2" : "#E5E7EB",
                              color:
                                prompt.difficulty === "easy" ? "#065F46" :
                                prompt.difficulty === "medium" ? "#92400E" :
                                prompt.difficulty === "hard" ? "#991B1B" : "#374151",
                              borderRadius: "4px",
                            }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </Drawer>
    </Box>
  );
}

