import { useEffect, useState, useRef } from "react";
import { Box, Typography, Grid, Card, CardContent, Button, Stack, Chip } from "@mui/material";
import { Upload } from "lucide-react";
import { deepEvalDatasetsService } from "../../../infrastructure/api/deepEvalDatasetsService";
import Alert from "../../components/Alert";
import ModalStandard from "../../components/Modals/StandardModal";

type ProjectDatasetsProps = { projectId: string };

type ListedDataset = {
  key: string;
  name: string;
  path: string;
  use_case: "chatbot" | "rag" | "safety";
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
  const [datasets, setDatasets] = useState<Record<"chatbot" | "rag" | "safety", ListedDataset[]>>({
    chatbot: [],
    rag: [],
    safety: [],
  });
  const [uploading, setUploading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      {(["chatbot", "rag", "safety"] as const).map((section) => {
        const items = datasets[section] || [];
        return (
          <Box key={section} sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "14px" }}>
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </Typography>
              <Chip size="small" label={items.length} sx={{ height: 20, fontSize: "11px" }} />
            </Box>
            {items.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "13px" }}>
                No datasets available.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {items.map((ds) => {
                  // Format difficulty display
                  const getDifficultyText = () => {
                    if (!ds.difficulty) return null;
                    const { easy, medium, hard } = ds.difficulty;
                    const parts = [];
                    if (easy > 0) parts.push(`${easy} easy`);
                    if (medium > 0) parts.push(`${medium} medium`);
                    if (hard > 0) parts.push(`${hard} hard`);
                    return parts.join(", ");
                  };

                  return (
                    <Grid item xs={12} sm={6} md={4} key={ds.key}>
                      <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                        <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                          <Typography sx={{ fontWeight: 600, mb: 1, fontSize: "14px" }}>{ds.name}</Typography>

                          {/* Description */}
                          {ds.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px", mb: 1.5, lineHeight: 1.5 }}>
                              {ds.description}
                            </Typography>
                          )}

                          {/* Statistics */}
                          {ds.test_count !== undefined && (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1, fontSize: "12px", color: "text.secondary" }}>
                              <Typography component="span" sx={{ fontSize: "12px", fontWeight: 600 }}>
                                {ds.test_count} test{ds.test_count !== 1 ? "s" : ""}
                              </Typography>
                              {ds.category_count && ds.category_count > 0 && (
                                <>
                                  <Typography component="span" sx={{ fontSize: "12px" }}>•</Typography>
                                  <Typography component="span" sx={{ fontSize: "12px" }}>
                                    {ds.category_count} {ds.category_count === 1 ? "category" : "categories"}
                                  </Typography>
                                </>
                              )}
                              {getDifficultyText() && (
                                <>
                                  <Typography component="span" sx={{ fontSize: "12px" }}>•</Typography>
                                  <Typography component="span" sx={{ fontSize: "12px" }}>
                                    {getDifficultyText()}
                                  </Typography>
                                </>
                              )}
                            </Box>
                          )}

                          {/* Categories/Topics */}
                          {ds.categories && ds.categories.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Topics
                              </Typography>
                              <Typography variant="body2" sx={{ fontSize: "11px", color: "text.secondary", mt: 0.25 }}>
                                {ds.categories.slice(0, 5).map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(", ")}
                                {ds.categories.length > 5 && ` +${ds.categories.length - 5} more`}
                              </Typography>
                            </Box>
                          )}

                          {/* Tags */}
                          {ds.tags && ds.tags.length > 0 && (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: "auto" }}>
                              {ds.tags.slice(0, 3).map((tag, idx) => (
                                <Chip
                                  key={idx}
                                  label={tag}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: "10px",
                                    backgroundColor: "#F3F4F6",
                                    color: "#6B7280",
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        );
      })}

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
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: "13px", mb: 1 }}>
              Required JSON structure
            </Typography>
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
    </Box>
  );
}


