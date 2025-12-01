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
  Button,
  useTheme,
} from "@mui/material";
import { Database, Upload, Download, X } from "lucide-react";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { useNavigate } from "react-router-dom";
import { deepEvalDatasetsService, type DatasetPromptRecord, type ListedDataset } from "../../../infrastructure/api/deepEvalDatasetsService";
import Alert from "../../components/Alert";
import ModalStandard from "../../components/Modals/StandardModal";
import EvaluationTable from "../../components/Table/EvaluationTable";
import type { IEvaluationRow } from "../../../domain/interfaces/i.table";
import SearchBox from "../../components/Search/SearchBox";
import { FilterBy, type FilterColumn } from "../../components/Table/FilterBy";
import { GroupBy } from "../../components/Table/GroupBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";
import singleTheme from "../../themes/v1SingleTheme";

type ProjectDatasetsProps = { projectId: string };

type BuiltInDataset = ListedDataset & {
  promptCount?: number;
};

export function ProjectDatasets({ projectId }: ProjectDatasetsProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [datasets, setDatasets] = useState<BuiltInDataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<BuiltInDataset | null>(null);
  const [datasetPrompts, setDatasetPrompts] = useState<DatasetPromptRecord[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  const loadDatasets = useCallback(async () => {
    try {
      setLoading(true);
      // Load built-in datasets instead of user datasets
      const res = await deepEvalDatasetsService.list();
      // Flatten all categories into a single array
      const allDatasets: BuiltInDataset[] = [];
      (["chatbot", "rag", "agent", "safety"] as const).forEach((category) => {
        const categoryDatasets = res[category] || [];
        categoryDatasets.forEach((ds) => {
          allDatasets.push(ds);
        });
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

  const tableColumns = ["DATASET", "USE CASE", "PATH", "STATUS", "ACTION"];

  const tableRows: IEvaluationRow[] = filteredDatasets.map((d) => ({
    id: d.path, // we use path as the unique identifier
    name: d.name,
    model: d.name,
    judge: d.use_case.charAt(0).toUpperCase() + d.use_case.slice(1),
    dataset: d.path,
    status: "Available",
  }));

  const handleOpenEditor = async (row: IEvaluationRow) => {
    // Open the dataset preview drawer and load prompts for the selected dataset
    const ds = datasets.find((d) => d.path === row.id) || null;
    setSelectedDataset(ds);
    setDrawerOpen(true);
    try {
      setLoadingPrompts(true);
      const res = await deepEvalDatasetsService.read(row.id);
      setDatasetPrompts(res.prompts || []);
    } catch (err) {
      console.error("Failed to load dataset prompts", err);
      setDatasetPrompts([]);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedDataset(null);
    setDatasetPrompts([]);
  };

  const handleDeleteDataset = async (path: string) => {
    try {
      await deepEvalDatasetsService.deleteDatasets([path]);
      setAlert({ variant: "success", body: "Dataset deleted" });
      setTimeout(() => setAlert(null), 3000);
      void loadDatasets();
    } catch (err) {
      console.error("Failed to delete dataset", err);
      setAlert({ variant: "error", body: "Failed to delete dataset" });
      setTimeout(() => setAlert(null), 5000);
    }
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
            text="Browse datasets"
            icon={<Database size={16} />}
            onClick={() => {
              if (!projectId) return;
              navigate(`/evals/${projectId}/datasets/built-in`);
            }}
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              gap: 2,
            }}
          />
        </Stack>
      </Stack>

      {/* Table of user datasets */}
      <Box mb={4}>
        <EvaluationTable
          columns={tableColumns}
          rows={tableRows}
          removeModel={{
            onConfirm: handleDeleteDataset,
          }}
          page={page}
          setCurrentPagingation={setPage}
          onShowDetails={handleOpenEditor}
        />
        {loading && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: "12px" }}>
            Loading datasets...
          </Typography>
        )}
      </Box>

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

