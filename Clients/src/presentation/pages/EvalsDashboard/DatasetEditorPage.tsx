import { useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography, TextField, Button, Paper, IconButton, Accordion, AccordionSummary, AccordionDetails, Chip } from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { deepEvalDatasetsService, DatasetPromptRecord } from "../../../infrastructure/api/deepEvalDatasetsService";
import { experimentsService } from "../../../infrastructure/api/evaluationLogsService";
import Alert from "../../components/Alert";
import { ArrowLeft, ChevronDown, Settings, Save as SaveIcon } from "lucide-react";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import TabBar from "../../components/TabBar";
import { TabContext } from "@mui/lab";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";
import { getSelectStyles } from "../../utils/inputStyles";
import { Select, MenuItem, useTheme } from "@mui/material";

type DatasetEditorPageProps = {
  embed?: boolean;
  initialPath?: string;
  isUserDataset?: boolean;
  suggestedName?: string | null;
  onSaved?: () => void;
  onBack?: () => void;
};

export default function DatasetEditorPage(props: DatasetEditorPageProps = {}) {
  const { projectId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const path = props.initialPath || params.get("path") || "";
  const [datasetName, setDatasetName] = useState<string>(props.suggestedName || "");
  const [prompts, setPrompts] = useState<DatasetPromptRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);
  const isUserDataset = Boolean(props.isUserDataset);
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
        
        // If no suggested name, derive from path
        if (!props.suggestedName) {
          const base = path.split("/").pop() || "dataset";
          setDatasetName(base.replace(/\.json$/i, "").replace(/[_-]+/g, " ").replace(/^\d+\s+/, ""));
        }
        
        if (projectId && !props.embed) {
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
            const projectData = await deepEvalProjectsService.getAllProjects();
            setAllProjects(projectData.projects || []);
          } catch { setAllProjects([]); }
        }
      } catch (e) {
        setAlert({ variant: "error", body: e instanceof Error ? e.message : "Failed to load dataset" });
        setTimeout(() => setAlert(null), 6000);
      } finally {
        setLoading(false);
      }
    })();
  }, [path, projectId, props.embed, props.suggestedName]);

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
          {props.embed ? (
            <IconButton 
              size="small" 
              onClick={() => props.onBack ? props.onBack() : window.history.back()} 
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </IconButton>
          ) : (
            <IconButton size="small" onClick={() => navigate(`/evals/${projectId}#datasets`)} aria-label="Back">
              <ArrowLeft size={18} />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "16px" }}>
            {isUserDataset ? "Edit dataset" : "Copy dataset"}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            disabled={!isValidToSave || saving || loading || !datasetName.trim()}
            sx={{ bgcolor: "#13715B", "&:hover": { bgcolor: "#0F5E4B" } }}
            startIcon={<SaveIcon size={16} />}
            onClick={async () => {
              try {
                setSaving(true);
                // Backend expects the dataset JSON to be an array of prompt objects
                const json = JSON.stringify(prompts, null, 2);
                const blob = new Blob([json], { type: "application/json" });
                // Use the dataset name to create a clean filename
                const slug = datasetName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
                const finalName = slug ? `${slug}.json` : "dataset.json";
                const file = new File([blob], finalName, { type: "application/json" });
                await deepEvalDatasetsService.uploadDataset(file);
                setAlert({ variant: "success", body: `Dataset "${datasetName}" saved successfully!` });
                setTimeout(() => {
                  setAlert(null);
                  if (props.onSaved) {
                    props.onSaved();
                  }
                }, 2000);
              } catch (e) {
                type AxiosLike = { response?: { data?: unknown } };
                const axiosErr = e as AxiosLike | Error;
                const resData = (axiosErr as AxiosLike)?.response?.data as Record<string, unknown> | undefined;
                const serverMsg =
                  (resData && (String(resData.message ?? "") || String(resData.detail ?? ""))) ||
                  (axiosErr instanceof Error ? axiosErr.message : null);
                setAlert({ variant: "error", body: serverMsg || "Save failed. Check dataset structure." });
                setTimeout(() => setAlert(null), 6000);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving..." : isUserDataset ? "Save" : "Save copy"}
          </Button>
        </Stack>
      </Stack>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Dataset name"
          value={datasetName}
          onChange={(e) => setDatasetName(e.target.value)}
          fullWidth
          size="small"
          placeholder="Enter a descriptive name for this dataset"
        />
        <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "13px" }}>
          {isUserDataset
            ? "Edit your dataset and click Save to update it."
            : "This is a copy. Rename it and edit the prompts, then click Save to add it to your datasets."}
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

                <Typography sx={{ fontSize: "12px", color: "#6B7280", mt: 1, mb: 0.5 }}>Expected output</Typography>
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

                <Typography sx={{ fontSize: "12px", color: "#6B7280", mt: 1, mb: 0.5 }}>Keywords</Typography>
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

                <Typography sx={{ fontSize: "12px", color: "#6B7280", mt: 1, mb: 0.5 }}>Retrieval context</Typography>
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
              </Paper>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Box>
  );
}


