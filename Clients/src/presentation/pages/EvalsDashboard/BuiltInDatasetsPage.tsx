import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Stack, Typography, Chip, Paper, Divider, Button, CircularProgress, IconButton, Select, MenuItem, useTheme } from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { deepEvalDatasetsService, DatasetPromptRecord } from "../../../infrastructure/api/deepEvalDatasetsService";
import { experimentsService } from "../../../infrastructure/api/evaluationLogsService";
import Alert from "../../components/Alert";
import { ArrowLeft, X, Settings, ChevronDown, Upload } from "lucide-react";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import TabBar from "../../components/TabBar";
import { TabContext } from "@mui/lab";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";
import { getSelectStyles } from "../../utils/inputStyles";

type ListedDataset = {
  key: string;
  name: string;
  path: string;
  use_case: "chatbot" | "rag" | "agent" | "safety";
  // Optional metadata for richer cards (if provided by backend)
  test_count?: number;
  categories?: string[];
  category_count?: number;
  difficulty?: { easy: number; medium: number; hard: number };
  description?: string;
  tags?: string[];
};

type BuiltInEmbedProps = { embed?: boolean; onOpenEditor?: (path: string, name: string) => void; onBack?: () => void };
export default function BuiltInDatasetsPage(_props: BuiltInEmbedProps) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const theme = useTheme();
  const embed = Boolean(_props?.embed);
  const openEditor = (path: string, name: string) => {
    if (_props?.embed && _props.onOpenEditor) {
      _props.onOpenEditor(path, name);
    } else {
      navigate(`/evals/${projectId}/datasets/editor?path=${encodeURIComponent(path)}`);
    }
  };
  const viewerTopRef = useRef<HTMLDivElement | null>(null);
  void _props;
  const [groups, setGroups] = useState<Record<"chatbot" | "rag" | "agent" | "safety", ListedDataset[]>>({
    chatbot: [],
    rag: [],
    agent: [],
    safety: [],
  });
  const [selected, setSelected] = useState<ListedDataset | null>(null);
  // keep local parsed prompts only; raw JSON preview not needed in this UI
  const [previewPrompts, setPreviewPrompts] = useState<DatasetPromptRecord[] | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);
  const [experimentsCount, setExperimentsCount] = useState<number>(0);
  const [datasetsCount, setDatasetsCount] = useState<number>(0);
  const [allProjects, setAllProjects] = useState<{ id: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // load projects for header dropdown
        try {
          const data = await deepEvalProjectsService.getAllProjects();
          setAllProjects(data.projects || []);
        } catch {
          setAllProjects([]);
        }

        // counts for TabBar, matching EvalsDashboard
        if (projectId) {
          try {
            const ex = await experimentsService.getAllExperiments({ project_id: projectId });
            setExperimentsCount(ex.experiments?.length || 0);
          } catch { setExperimentsCount(0); }
        }

        const res = await deepEvalDatasetsService.list();
        setGroups(res);
        try {
          const totalCount = Object.values(res).reduce((sum, arr) => sum + (arr?.length || 0), 0);
          setDatasetsCount(totalCount);
        } catch { setDatasetsCount(0); }
        if (!embed) {
          const path = params.get("path");
          if (path) {
            const match = Object.values(res).flat().find((d) => d.path === path);
            if (match) {
              setSelected(match);
            }
          }
        }
      } catch (e) {
        setAlert({ variant: "error", body: e instanceof Error ? e.message : "Failed to load datasets" });
        setTimeout(() => setAlert(null), 6000);
      }
    })();
  }, [params, projectId, embed]);

  useEffect(() => {
    const path = selected?.path || "";
    if (!path) return;
    (async () => {
      try {
        setLoadingPreview(true);
        const data = await deepEvalDatasetsService.read(path);
        setPreviewPrompts(data.prompts || []);
        if (!embed) {
          setParams((p) => {
            const np = new URLSearchParams(p);
            np.set("path", path);
            return np;
          }, { replace: true });
        }
      } catch (e) {
        setAlert({ variant: "error", body: e instanceof Error ? e.message : "Failed to load dataset" });
        setTimeout(() => setAlert(null), 6000);
      } finally {
        setLoadingPreview(false);
      }
    })();
  }, [selected, setParams, embed]);

  const descriptions: Record<string, string> = useMemo(() => ({
    chatbot: "Chatbot prompts for single‑turn or conversational evaluation of assistant replies.",
    rag: "RAG tasks with retrieval_context, suitable for faithfulness/contextual metrics.",
    agent: "Agentic tasks that involve tools and multi‑step plans.",
    safety: "Safety prompts for toxicity/harassment/PII leakage and related checks.",
  }), []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const resp = await deepEvalDatasetsService.uploadDataset(file);
      setAlert({ variant: "success", body: `Uploaded ${resp.filename}` });
      setTimeout(() => setAlert(null), 4000);
      // Reload groups so any new datasets that are exposed via list() appear
      const res = await deepEvalDatasetsService.list();
      setGroups(res);
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
    <Box sx={{ p: 2 }}>
      {alert && <Alert variant={alert.variant} body={alert.body} />}
      {!embed && (
        <>
          <PageBreadcrumbs
            items={[
              { label: "Dashboard", path: "/" },
              { label: "LLM evals", path: "/evals" },
              { label: "Project", path: `/evals/${projectId}` },
              { label: "Built‑in datasets", path: `/evals/${projectId}/datasets/built-in` },
            ]}
          />
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, mt: -2 }} />
        </>
      )}
      {/* Project selector + settings (match project pages) - ABOVE tabs */}
      {!embed && (<Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
        }}
      >
        <Stack gap={theme.spacing(2)} className="select-wrapper" sx={{ mb: 0 }}>
          <Typography
            component="p"
            variant="body1"
            color={theme.palette.text.secondary}
            fontWeight={500}
            fontSize="13px"
            sx={{ margin: 0, height: "22px", display: "flex", alignItems: "center" }}
          >
            Project
          </Typography>
          <Select
            className="select-component"
            value={projectId || ""}
            onChange={(e) => {
              const newId = String(e.target.value);
              navigate(`/evals/${newId}#datasets`);
            }}
            displayEmpty
            IconComponent={() => (
              <ChevronDown
                size={16}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: theme.palette.text.tertiary,
                }}
              />
            )}
            MenuProps={{
              disableScrollLock: true,
              PaperProps: {
                sx: {
                  borderRadius: theme.shape.borderRadius,
                  boxShadow: theme.boxShadow,
                  mt: 1,
                  "& .MuiMenuItem-root": {
                    fontSize: 13,
                    color: theme.palette.text.primary,
                    "&:hover": { backgroundColor: theme.palette.background.accent },
                    "&.Mui-selected": {
                      backgroundColor: theme.palette.background.accent,
                      "&:hover": { backgroundColor: theme.palette.background.accent },
                    },
                    "& .MuiTouchRipple-root": { display: "none" },
                  },
                },
              },
            }}
            sx={{
              fontSize: 13,
              minWidth: "160px",
              maxWidth: "260px",
              backgroundColor: theme.palette.background.main,
              position: "relative",
              cursor: "pointer",
              "& .MuiSelect-select": {
                padding: "0 32px 0 10px !important",
                height: "34px",
                display: "flex",
                alignItems: "center",
                lineHeight: 2,
              },
              ...getSelectStyles(theme),
            }}
          >
            {allProjects.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </Stack>
        <IconButton aria-label="Settings" onClick={() => navigate(`/evals/${projectId}/configuration`)}>
          <Settings size={18} />
        </IconButton>
      </Box>)}

      {!embed && (<TabContext value="datasets">
        <TabBar
          activeTab="datasets"
          onChange={(_, v: string) => {
            if (!projectId) return;
            navigate(`/evals/${projectId}#${v}`);
          }}
          tabs={[
            { value: "overview", label: "Overview", icon: "LayoutDashboard" },
            { value: "experiments", label: "Experiments", icon: "FlaskConical", count: experimentsCount },
            { value: "datasets", label: "Datasets", icon: "Database", count: datasetsCount },
            { value: "scorers", label: "Scorers", icon: "Award" },
            { value: "configuration", label: "Configuration", icon: "Settings" },
          ]}
          tabListSx={{ mb: 2 }}
        />
      </TabContext>)}
      {!embed && <Divider sx={{ mb: 2 }} />}

      {/* Title with back button when embedded */}
      {embed ? (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <IconButton
            size="small"
            onClick={() => (_props.onBack ? _props.onBack() : window.history.back())}
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "16px" }}>
            Built‑in datasets
          </Typography>
        </Stack>
      ) : (
        <>
          {/* Hidden file input for uploads */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={handleFileChange}
          />

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
                startIcon={<Upload size={14} />}
              >
                {uploading ? "Uploading..." : "Upload JSON"}
              </Button>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "13px" }}>
              Use pre-built datasets for chatbot, RAG, and safety evaluations, or upload your own custom datasets in JSON format.
            </Typography>
          </Box>
        </>
      )}

      <Stack direction="row" spacing={2}>
        {selected && (
        <Box sx={{ width: 360 }}>
          {(["chatbot", "rag", "agent", "safety"] as const).map((uc) => (
            <Box key={uc} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: "capitalize", fontSize: "13px", mb: 0.5 }}>
                {uc} <Chip size="small" label={(groups[uc] || []).length} sx={{ height: 18, fontSize: "10px", ml: 0.5 }} />
              </Typography>
              <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "12px", mb: 1 }}>
                {descriptions[uc]}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                {(groups[uc] || []).map((ds) => (
                  <Button
                    key={ds.key}
                    variant={selected?.key === ds.key ? "contained" : "outlined"}
                    onClick={() => setSelected(ds)}
                    sx={{
                      justifyContent: "flex-start",
                      textTransform: "none",
                      borderRadius: "8px",
                      px: 1.25,
                      py: 0.75,
                      minHeight: 32,
                      fontSize: "12px",
                    }}
                    fullWidth
                  >
                    {ds.name}
                  </Button>
                ))}
              </Stack>
            </Box>
          ))}
        </Box>
        )}
        {selected ? (
          <Box sx={{ flex: 1 }}>
            {loadingPreview ? (
            <Paper variant="outlined" sx={{ p: 2, height: "70vh", overflow: "auto" }}>
              <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
                <CircularProgress size={24} />
              </Stack>
            </Paper>
            ) : previewPrompts && previewPrompts.length > 0 ? (
              <Paper variant="outlined" sx={{ p: 2, height: "70vh", overflow: "auto" }}>
                <Box ref={viewerTopRef} />
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "13px" }}>{selected.name}</Typography>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={() => setSelected(null)} title="Close viewer" aria-label="Close viewer">
                      <X size={16} />
                    </IconButton>
                    <Button size="small" variant="contained" sx={{ bgcolor: "#13715B", "&:hover": { bgcolor: "#0F5E4B" } }} onClick={() => openEditor(selected.path, selected.name)}>
                      Open in editor
                    </Button>
                  </Stack>
                </Stack>
                <Stack spacing={1.25}>
                  {previewPrompts.map((p, idx) => (
                    <Paper key={p.id} variant="outlined" sx={{ p: 1.25 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "12px" }}>{`Prompt ${idx + 1}`}</Typography>
                        <Chip
                          label={p.category}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "10px",
                            bgcolor: p.category?.toLowerCase().includes("coding")
                              ? "#E6F4EF"
                              : p.category?.toLowerCase().includes("math")
                              ? "#E6F1FF"
                              : p.category?.toLowerCase().includes("reason")
                              ? "#FFF4E6"
                              : "#F3F4F6",
                          }}
                        />
                      </Stack>
                      <Typography sx={{ fontSize: "12px", color: "#111827", whiteSpace: "pre-wrap" }}>
                        {p.prompt}
                      </Typography>
                      {p.expected_output && (
                        <Typography sx={{ mt: 0.75, fontSize: "12px", color: "#4B5563" }}>
                          <b>Expected:</b> {p.expected_output}
                        </Typography>
                      )}
                      {Array.isArray(p.expected_keywords) && p.expected_keywords.length > 0 && (
                        <Typography sx={{ mt: 0.5, fontSize: "12px", color: "#4B5563" }}>
                          <b>Keywords:</b> {p.expected_keywords.join(", ")}
                        </Typography>
                      )}
                      {Array.isArray(p.retrieval_context) && p.retrieval_context.length > 0 && (
                        <Typography sx={{ mt: 0.5, fontSize: "12px", color: "#4B5563", whiteSpace: "pre-wrap" }}>
                          <b>Context:</b> {p.retrieval_context.join("\n")}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            ) : (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ color: "#6B7280" }}>
                  No prompts found for this dataset.
                </Typography>
              </Paper>
            )}
          </Box>
        ) : (
          <Box sx={{ flex: 1 }}>
            <Box sx={{ maxWidth: 1000, mx: "auto" }}>
              {(["chatbot", "rag", "agent", "safety"] as const).map((uc) => (
                <Box key={uc} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "13px", textTransform: "capitalize", mb: 1 }}>
                    {uc}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                    {(groups[uc] || []).map((ds) => {
                      const difficultyText = (() => {
                        if (!ds.difficulty) return "";
                        const { easy, medium, hard } = ds.difficulty;
                        const parts: string[] = [];
                        if (easy) parts.push(`${easy} easy`);
                        if (medium) parts.push(`${medium} medium`);
                        if (hard) parts.push(`${hard} hard`);
                        return parts.join(", ");
                      })();

                      return (
                        <Paper
                          key={ds.key}
                          variant="outlined"
                          sx={{
                            p: 2,
                            width: 380,
                            borderRadius: 2,
                            borderColor: "#E5E7EB",
                            boxShadow: "none",
                            backgroundColor: "#FFFFFF",
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          <Typography sx={{ fontWeight: 600, fontSize: "14px", mb: 0.5 }}>
                            {ds.name}
                          </Typography>

                          {ds.description && (
                            <Typography
                              variant="body2"
                              sx={{ fontSize: "12px", color: "#4B5563", lineHeight: 1.6 }}
                            >
                              {ds.description}
                            </Typography>
                          )}

                          {(ds.test_count !== undefined ||
                            ds.category_count !== undefined ||
                            difficultyText) && (
                            <Typography
                              variant="body2"
                              sx={{ fontSize: "11px", color: "#4B5563" }}
                            >
                              {ds.test_count !== undefined && (
                                <strong>
                                  {ds.test_count} test{ds.test_count !== 1 ? "s" : ""}
                                </strong>
                              )}
                              {ds.category_count !== undefined && ds.category_count > 0 && (
                                <>
                                  {" "}
                                  – {ds.category_count}{" "}
                                  {ds.category_count === 1 ? "category" : "categories"}
                                </>
                              )}
                              {difficultyText && (
                                <>
                                  {" "}
                                  – {difficultyText}
                                </>
                              )}
                            </Typography>
                          )}

                          {ds.categories && ds.categories.length > 0 && (
                            <Box sx={{ mt: 0.5 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "10px",
                                  textTransform: "uppercase",
                                  fontWeight: 600,
                                  color: "#6B7280",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Topics
                              </Typography>
                              <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", mt: 0.5 }}>
                                {ds.categories.slice(0, 4).map((c) => (
                                  <Chip
                                    key={c}
                                    size="small"
                                    label={c}
                                    sx={{
                                      height: 20,
                                      fontSize: "10px",
                                      borderRadius: "999px",
                                      backgroundColor: "#F3F4F6",
                                      color: "#4B5563",
                                    }}
                                  />
                                ))}
                                {ds.categories.length > 4 && (
                                  <Typography
                                    variant="caption"
                                    sx={{ fontSize: "10px", color: "#6B7280", ml: 0.5 }}
                                  >
                                    +{ds.categories.length - 4} more
                                  </Typography>
                                )}
                              </Stack>
                            </Box>
                          )}

                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              sx={{
                                textTransform: "none",
                                bgcolor: "#13715B",
                                "&:hover": { bgcolor: "#0F5E4B" },
                              }}
                              onClick={() => {
                                setSelected(ds);
                                setTimeout(() => {
                                  viewerTopRef.current?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                  });
                                }, 0);
                              }}
                            >
                              View prompts
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              sx={{
                                textTransform: "none",
                                bgcolor: "#13715B",
                                "&:hover": { bgcolor: "#0F5E4B" },
                              }}
                              onClick={() => openEditor(ds.path, ds.name)}
                            >
                              Open in editor
                            </Button>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Stack>
    </Box>
  );
}


