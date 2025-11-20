import { useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography, TextField, Button, Paper, IconButton, Accordion, AccordionSummary, AccordionDetails, Chip, Tooltip } from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { deepEvalDatasetsService, DatasetPromptRecord } from "../../../infrastructure/api/deepEvalDatasetsService";
import { experimentsService } from "../../../infrastructure/api/evaluationLogsService";
import Alert from "../../components/Alert";
import { ArrowLeft, Pencil, ChevronDown, Eye, Settings, Save as SaveIcon } from "lucide-react";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import TabBar from "../../components/TabBar";
import { TabContext } from "@mui/lab";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";
import { getSelectStyles } from "../../utils/inputStyles";
import { Select, MenuItem, useTheme } from "@mui/material";

type DatasetEditorPageProps = {
  embed?: boolean;
  initialPath?: string;
};

export default function DatasetEditorPage(props: DatasetEditorPageProps = {}) {
  const { projectId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const path = props.initialPath || params.get("path") || "";
  const [filename, setFilename] = useState<string>("");
  const [prompts, setPrompts] = useState<DatasetPromptRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const datasetName = decodeURIComponent(path || "").split("/").pop()?.replace(/\.json$/i, "").replace(/[_-]+/g, " ") || "Dataset";
  const [experimentsCount, setExperimentsCount] = useState<number>(0);
  const [datasetsCount, setDatasetsCount] = useState<number>(0);
  const [allProjects, setAllProjects] = useState<{ id: string; name: string }[]>([]);
  const theme = useTheme();

  useEffect(() => {
    (async () => {
      if (!path) return;
      try {
        setLoading(true);
        const data = await deepEvalDatasetsService.read(path);
        setPrompts(data.prompts || []);
        const base = path.split("/").pop() || "dataset.json";
        setFilename(base.replace(/\.json$/i, "") + "-copy.json");
        if (projectId) {
          try {
            const ex = await experimentsService.getAllExperiments({ project_id: projectId });
            setExperimentsCount(ex.experiments?.length || 0);
          } catch { setExperimentsCount(0); }
          try {
            const list = await deepEvalDatasetsService.list();
            const totalCount = Object.values(list).reduce((sum, arr) => sum + (arr?.length || 0), 0);
            setDatasetsCount(totalCount);
          } catch { setDatasetsCount(0); }

          try {
            const data = await deepEvalProjectsService.getAllProjects();
            setAllProjects(data.projects || []);
          } catch { setAllProjects([]); }
        }
      } catch (e) {
        setAlert({ variant: "error", body: e instanceof Error ? e.message : "Failed to load dataset" });
        setTimeout(() => setAlert(null), 6000);
      } finally {
        setLoading(false);
      }
    })();
  }, [path, projectId]);

  const isValidToSave = useMemo(() => prompts && prompts.length > 0, [prompts]);

  return (
    <Box sx={{ p: 2 }}>
      {alert && <Alert variant={alert.variant} body={alert.body} />}
      {!props.embed && <PageBreadcrumbs
        items={[
          { label: "Dashboard", path: "/" },
          { label: "LLM evals", path: "/evals" },
          { label: "Project", path: `/evals/${projectId}` },
          { label: "Datasets", path: `/evals/${projectId}#datasets` },
          { label: datasetName, path: `/evals/${projectId}/datasets/editor?path=${encodeURIComponent(path)}` },
        ]}
      />}
      {!props.embed && <TabContext value="datasets">
        <TabBar
          activeTab="datasets"
          onChange={(_, v: string) => {
            if (!projectId) return;
            // Navigate to project page tabs
            window.location.href = `/evals/${projectId}#${v}`;
          }}
          tabs={[
            { value: "overview", label: "Overview", icon: "LayoutDashboard" },
            { value: "experiments", label: "Experiments", icon: "FlaskConical", count: experimentsCount },
            { value: "datasets", label: "Datasets", icon: "Database", count: datasetsCount },
            { value: "configuration", label: "Configuration", icon: "Settings" },
          ]}
          tabListSx={{ mb: 1 }}
        />
      </TabContext>}

      {/* Project selector + settings to match project pages */}
      {!props.embed && <Box
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
            value={projectId || ""}
            onChange={(e) => {
              const newId = String(e.target.value);
              window.location.href = `/evals/${newId}#datasets`;
            }}
            displayEmpty
            IconComponent={() => <ChevronDown size={14} style={{ marginRight: 8 }} />}
            sx={getSelectStyles(theme)}
          >
            {allProjects.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </Stack>
        <IconButton aria-label="Settings" onClick={() => window.location.assign(`/evals/${projectId}/configuration`)}>
          <Settings size={18} />
        </IconButton>
      </Box>}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton size="small" onClick={() => navigate(`/evals/${projectId}/datasets/built-in?path=${encodeURIComponent(path)}`)} aria-label="Back">
            <ArrowLeft size={18} />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "16px" }}>
            Dataset editor
          </Typography>
          {!editing ? (
            <Tooltip title="View only">
              <span>
                <Chip size="small" icon={<Eye size={12} />} label="View only" sx={{ height: 22 }} />
              </span>
            </Tooltip>
          ) : (
            <Chip size="small" color="success" label="Editing copy" sx={{ height: 22 }} />
          )}
        </Stack>
        <Stack direction="row" spacing={1}>
          {!editing && (
            <Button variant="contained" startIcon={<Pencil size={16} />} onClick={() => setEditing(true)} disabled={loading} sx={{ bgcolor: "#13715B", "&:hover": { bgcolor: "#0F5E4B" } }}>
              Duplicate to edit
            </Button>
          )}
          <Button
            variant="contained"
            disabled={!isValidToSave || !editing || saving || loading}
            sx={{ bgcolor: "#13715B", "&:hover": { bgcolor: "#0F5E4B" } }}
            startIcon={<SaveIcon size={16} />}
            onClick={async () => {
              try {
                setSaving(true);
                const json = JSON.stringify({ prompts }, null, 2);
                const blob = new Blob([json], { type: "application/json" });
                const slug = datasetName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
                const finalName = filename || (slug ? `${slug}-copy.json` : "dataset-copy.json");
                const file = new File([blob], finalName, { type: "application/json" });
                await deepEvalDatasetsService.uploadDataset(file);
                setAlert({ variant: "success", body: "Saved as a new dataset in your uploads." });
                setTimeout(() => setAlert(null), 4000);
              } catch (e) {
                setAlert({ variant: "error", body: e instanceof Error ? e.message : "Save failed" });
                setTimeout(() => setAlert(null), 6000);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </Stack>
      </Stack>
      <Stack spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {datasetName}
        </Typography>
        <Typography variant="body2" sx={{ color: "#6B7280" }}>
          {editing
            ? "You are editing a duplicate of the built‑in dataset. When you save, it will be stored in your uploads."
            : "This is a read‑only view. Click 'Duplicate to edit' to make a copy you can modify."}
        </Typography>
      </Stack>
      <Stack spacing={1.25}>
        {prompts.map((p, idx) => (
          <Accordion key={p.id || idx} disableGutters>
            <AccordionSummary expandIcon={<ChevronDown size={16} />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography sx={{ fontWeight: 700, fontSize: "13px" }}>{`Prompt ${idx + 1}`}</Typography>
                <Chip size="small" label={p.category || "uncategorized"} sx={{ height: 18, fontSize: "10px" }} />
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Paper variant="outlined" sx={{ p: 1.25 }}>
                <Typography sx={{ fontSize: "12px", color: "#6B7280", mb: 0.5 }}>Prompt</Typography>
                {editing ? (
                  <TextField
                    size="small"
                    value={p.prompt}
                    onChange={(e) => {
                      const next = [...prompts];
                      next[idx] = { ...next[idx], prompt: e.target.value };
                      setPrompts(next);
                    }}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                ) : (
                  <Typography sx={{ fontSize: "13px", color: "#111827", whiteSpace: "pre-wrap" }}>{p.prompt}</Typography>
                )}

                <Typography sx={{ fontSize: "12px", color: "#6B7280", mt: 1, mb: 0.5 }}>Expected output</Typography>
                {editing ? (
                  <TextField
                  size="small"
                  value={p.expected_output || ""}
                  onChange={(e) => {
                    const next = [...prompts];
                    next[idx] = { ...next[idx], expected_output: e.target.value };
                    setPrompts(next);
                  }}
                  fullWidth
                  multiline
                  minRows={2}
                  />
                ) : (
                  <Typography sx={{ fontSize: "13px", color: "#111827", whiteSpace: "pre-wrap" }}>{p.expected_output || "-"}</Typography>
                )}

                <Typography sx={{ fontSize: "12px", color: "#6B7280", mt: 1, mb: 0.5 }}>Keywords</Typography>
                {editing ? (
                  <TextField
                    size="small"
                    value={(p.expected_keywords || []).join(", ")}
                    onChange={(e) => {
                      const value = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                      const next = [...prompts];
                      next[idx] = { ...next[idx], expected_keywords: value };
                      setPrompts(next);
                    }}
                    fullWidth
                    placeholder="Comma separated"
                  />
                ) : (
                  <Typography sx={{ fontSize: "13px", color: "#111827" }}>{(p.expected_keywords || []).join(", ") || "-"}</Typography>
                )}

                <Typography sx={{ fontSize: "12px", color: "#6B7280", mt: 1, mb: 0.5 }}>Retrieval context</Typography>
                {editing ? (
                  <TextField
                    size="small"
                    value={(p.retrieval_context || []).join("\n")}
                    onChange={(e) => {
                      const lines = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
                      const next = [...prompts];
                      next[idx] = { ...next[idx], retrieval_context: lines };
                      setPrompts(next);
                    }}
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="One entry per line"
                  />
                ) : (
                  <Typography sx={{ fontSize: "13px", color: "#111827", whiteSpace: "pre-wrap" }}>
                    {(p.retrieval_context || []).join("\n") || "-"}
                  </Typography>
                )}
              </Paper>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Box>
  );
}


