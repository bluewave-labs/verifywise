import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { deepEvalDatasetsService, DatasetPromptRecord } from "../../../infrastructure/api/deepEvalDatasetsService";
import Alert from "../../components/Alert";
import { ArrowLeft, ChevronDown, Save as SaveIcon } from "lucide-react";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";

export default function DatasetEditorPage() {
  const { projectId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const path = params.get("path") || "";
  const [datasetName, setDatasetName] = useState<string>("");
  const [prompts, setPrompts] = useState<DatasetPromptRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);

  useEffect(() => {
    (async () => {
      if (!path) return;
      try {
        setLoading(true);
        const data = await deepEvalDatasetsService.read(path);
        setPrompts(data.prompts || []);

        // Derive name from path
        const base = path.split("/").pop() || "dataset";
        setDatasetName(base.replace(/\.json$/i, "").replace(/[_-]+/g, " ").replace(/^\d+\s+/, ""));
      } catch (e) {
        setAlert({ variant: "error", body: e instanceof Error ? e.message : "Failed to load dataset" });
        setTimeout(() => setAlert(null), 6000);
      } finally {
        setLoading(false);
      }
    })();
  }, [path]);

  const isValidToSave = useMemo(() => prompts && prompts.length > 0, [prompts]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const json = JSON.stringify(prompts, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const slug = datasetName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      const finalName = slug ? `${slug}.json` : "dataset.json";
      const file = new File([blob], finalName, { type: "application/json" });
      await deepEvalDatasetsService.uploadDataset(file);
      setAlert({ variant: "success", body: `Dataset "${datasetName}" saved successfully!` });
      setTimeout(() => {
        setAlert(null);
        navigate(`/evals/${projectId}#datasets`);
      }, 1500);
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
  };

  const handleBack = () => {
    navigate(`/evals/${projectId}#datasets`);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress sx={{ color: "#13715B" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: "900px", margin: "0 auto", p: 3 }}>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      <PageBreadcrumbs
        items={[
          { label: "Dashboard", path: "/" },
          { label: "LLM evals", path: "/evals" },
          { label: "Project", path: `/evals/${projectId}` },
          { label: "Datasets", path: `/evals/${projectId}#datasets` },
          { label: datasetName || "Editor", path: `/evals/${projectId}/datasets/editor?path=${encodeURIComponent(path)}` },
        ]}
      />

      {/* Header with back button and save */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3, mt: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton size="small" onClick={handleBack} aria-label="Back">
            <ArrowLeft size={18} />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "16px" }}>
            Edit dataset
          </Typography>
        </Stack>
        <Button
          variant="contained"
          disabled={!isValidToSave || saving || !datasetName.trim()}
          sx={{ bgcolor: "#13715B", "&:hover": { bgcolor: "#0F5E4B" } }}
          startIcon={<SaveIcon size={16} />}
          onClick={handleSave}
        >
          {saving ? "Saving..." : "Save copy"}
        </Button>
      </Stack>

      {/* Dataset name input */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Dataset name"
          value={datasetName}
          onChange={(e) => setDatasetName(e.target.value)}
          fullWidth
          size="small"
          placeholder="Enter a descriptive name for this dataset"
        />
        <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "13px" }}>
          Edit the prompts below, then click Save to add a copy to your datasets.
        </Typography>
      </Stack>

      {/* Prompts editor */}
      <Stack spacing={1.25}>
        {prompts.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
            No prompts found in this dataset.
          </Typography>
        ) : (
          prompts.map((p, idx) => (
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
          ))
        )}
      </Stack>
    </Box>
  );
}
