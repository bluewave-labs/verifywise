import { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Drawer,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { Download, Database, X } from "lucide-react";
import { deepEvalDatasetsService, type DatasetPromptRecord } from "../../../infrastructure/api/deepEvalDatasetsService";
import Alert from "../../components/Alert";
import ModalStandard from "../../components/Modals/StandardModal";
import singleTheme from "../../themes/v1SingleTheme";
import TablePaginationActions from "../../components/TablePagination";
import IconButtonComponent from "../../components/IconButton";

const STORAGE_KEY = "datasets_rows_per_page";
const DEFAULT_ROWS_PER_PAGE = 10;

type ProjectDatasetsProps = { projectId: string };

type ListedDataset = {
  key: string;
  name: string;
  path: string;
  use_case: "chatbot" | "rag" | "safety" | "agent";
  test_count?: number;
  categories?: string[];
  category_count?: number;
  difficulty?: { easy: number; medium: number; hard: number };
  description?: string;
  tags?: string[];
};

export function ProjectDatasets(_props: ProjectDatasetsProps) {
  // Mark prop as intentionally unused (keeps component signature stable)
  void _props.projectId;
  const theme = useTheme();
  const [datasets, setDatasets] = useState<Record<"chatbot" | "rag" | "safety" | "agent", ListedDataset[]>>({
    chatbot: [],
    rag: [],
    safety: [],
    agent: [],
  });
  const [uploading, setUploading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drawer state for viewing dataset content
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<ListedDataset | null>(null);
  const [datasetPrompts, setDatasetPrompts] = useState<DatasetPromptRecord[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
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

  // Delete dataset handler
  const handleDeleteDataset = async (datasetPath: string) => {
    try {
      await deepEvalDatasetsService.deleteDatasets([datasetPath]);
      setAlert({ variant: "success", body: "Dataset deleted successfully" });
      setTimeout(() => setAlert(null), 4000);
      await load();
    } catch (err) {
      setAlert({ variant: "error", body: err instanceof Error ? err.message : "Failed to delete dataset" });
      setTimeout(() => setAlert(null), 6000);
    }
  };

  const handleDatasetClick = async (ds: ListedDataset) => {
    setSelectedDataset(ds);
    setDrawerOpen(true);
    setLoadingPrompts(true);
    setDatasetPrompts([]);

    try {
      const result = await deepEvalDatasetsService.read(ds.path);
      setDatasetPrompts(result.prompts || []);
    } catch (err) {
      setAlert({ variant: "error", body: err instanceof Error ? err.message : "Failed to load dataset content" });
      setTimeout(() => setAlert(null), 6000);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedDataset(null);
    setDatasetPrompts([]);
  };

  const load = async () => {
    try {
      const list = await deepEvalDatasetsService.list();
      setDatasets(list);
    } catch (e) {
      setAlert({ variant: "error", body: e instanceof Error ? e.message : "Failed to load datasets" });
      setTimeout(() => setAlert(null), 6000);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
      await load();
    } catch (err) {
      setAlert({
        variant: "error",
        body: err instanceof Error ? err.message : "Upload failed",
      });
      setTimeout(() => setAlert(null), 6000);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Box>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "16px" }}>
            Datasets
          </Typography>
          <Button
            variant="outlined"
            size="small"
            disabled={uploading}
            onClick={handleUploadClick}
            sx={{ textTransform: "none" }}
          >
            {uploading ? "Uploading..." : "Upload JSON"}
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "13px" }}>
          Use pre-built datasets for chatbot, RAG, and safety evaluations, or upload your own custom datasets in JSON format.
        </Typography>
      </Box>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={handleFileChange}
      />

      {/* Datasets Table */}
      {(() => {
        // Flatten all datasets into a single list with use_case
        const allDatasets = [
          ...datasets.chatbot.map(ds => ({ ...ds, use_case: "chatbot" as const })),
          ...datasets.rag.map(ds => ({ ...ds, use_case: "rag" as const })),
          ...datasets.safety.map(ds => ({ ...ds, use_case: "safety" as const })),
          ...datasets.agent.map(ds => ({ ...ds, use_case: "agent" as const })),
        ];

        const getCategoryColor = (category: string) => {
          switch (category) {
            case "rag": return { bg: "#DBEAFE", color: "#1E40AF" };
            case "chatbot": return { bg: "#D1FAE5", color: "#065F46" };
            case "safety": return { bg: "#FEE2E2", color: "#991B1B" };
            case "agent": return { bg: "#FEF3C7", color: "#92400E" };
            default: return { bg: "#E5E7EB", color: "#374151" };
          }
        };

        if (allDatasets.length === 0) {
          return (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="body2" color="text.secondary">
                No datasets available.
              </Typography>
            </Box>
          );
        }

        // Paginate the datasets
        const paginatedDatasets = rowsPerPage > 0
          ? allDatasets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          : allDatasets;

        return (
          <TableContainer>
            <Table sx={singleTheme.tableStyles.primary.frame}>
              <TableHead
                sx={{
                  backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors,
                }}
              >
                <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "35%" }}>
                    Name
                  </TableCell>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "12%" }}>
                    Category
                  </TableCell>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "10%" }}>
                    Tests
                  </TableCell>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "35%" }}>
                    Topics
                  </TableCell>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "8%" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedDatasets.map((ds) => {
                  const categoryColors = getCategoryColor(ds.use_case);
                  return (
                    <TableRow
                      key={ds.key}
                      onClick={() => handleDatasetClick(ds)}
                      sx={{
                        ...singleTheme.tableStyles.primary.body.row,
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "#f5f5f5",
                        },
                      }}
                    >
                      {/* Name */}
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Database size={14} color="#6B7280" />
                          <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                            {ds.name}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Category */}
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        <Chip
                          label={ds.use_case.charAt(0).toUpperCase() + ds.use_case.slice(1)}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: "11px",
                            fontWeight: 500,
                            backgroundColor: categoryColors.bg,
                            color: categoryColors.color,
                            borderRadius: "4px",
                          }}
                        />
                      </TableCell>

                      {/* Tests */}
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        <Typography sx={{ fontSize: "13px", color: "#374151" }}>
                          {ds.test_count !== undefined ? ds.test_count : "-"}
                        </Typography>
                      </TableCell>

                      {/* Topics */}
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        {ds.categories && ds.categories.length > 0 ? (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {ds.categories.slice(0, 3).map((cat, idx) => (
                              <Chip
                                key={idx}
                                label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "10px",
                                  backgroundColor: "#E5E7EB",
                                  color: "#374151",
                                  borderRadius: "4px",
                                }}
                              />
                            ))}
                            {ds.categories.length > 3 && (
                              <Chip
                                label={`+${ds.categories.length - 3}`}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "10px",
                                  backgroundColor: "#E5E7EB",
                                  color: "#374151",
                                  borderRadius: "4px",
                                }}
                              />
                            )}
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: "12px", color: "#9CA3AF" }}>-</Typography>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell
                        sx={singleTheme.tableStyles.primary.body.cell}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconButtonComponent
                          id={ds.key}
                          onDelete={() => handleDeleteDataset(ds.path)}
                          onEdit={() => {}}
                          onMouseEvent={() => {}}
                          warningTitle="Delete this dataset?"
                          warningMessage="This action cannot be undone. The dataset will be permanently removed."
                          type="dataset"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                    colSpan={5}
                    count={allDatasets.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    ActionsComponent={TablePaginationActions}
                    sx={{
                      borderBottom: "none",
                      "& .MuiTablePagination-toolbar": {
                        minHeight: "52px",
                      },
                      "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                        fontSize: "13px",
                      },
                    }}
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        );
      })()}

      {/* Upload Instructions Modal */}
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
                  {datasetPrompts.map((prompt, index) => (
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


