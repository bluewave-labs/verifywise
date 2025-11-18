import { useEffect, useState } from "react";
import { Box, Typography, Grid, Card, CardContent, Button, Stack, Chip } from "@mui/material";
import { deepEvalDatasetsService } from "../../../infrastructure/api/deepEvalDatasetsService";
import Alert from "../../components/Alert";

type ProjectDatasetsProps = { projectId: string };

type ListedDataset = { key: string; name: string; path: string; use_case: "chatbot" | "rag" | "agent" | "safety" };

export function ProjectDatasets(_props: ProjectDatasetsProps) {
  // Mark prop as intentionally unused (keeps component signature stable)
  void _props.projectId;
  const [datasets, setDatasets] = useState<Record<"chatbot" | "rag" | "agent" | "safety", ListedDataset[]>>({
    chatbot: [],
    rag: [],
    agent: [],
    safety: [],
  });
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);

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

  return (
    <Box sx={{ userSelect: "none" }}>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "16px" }}>
          Datasets
        </Typography>
        <Button
          variant="outlined"
          component="label"
          size="small"
          disabled={uploading}
          sx={{ textTransform: "none" }}
        >
          {uploading ? "Uploading..." : "Upload JSON"}
          <input
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                setUploading(true);
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
              }
            }}
          />
        </Button>
      </Stack>

      {(["chatbot", "rag", "agent", "safety"] as const).map((section) => {
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
                {items.map((ds) => (
                  <Grid item xs={12} sm={6} md={4} key={ds.key}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <CardContent>
                        <Typography sx={{ fontWeight: 600, mb: 0.5, fontSize: "14px" }}>{ds.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px", mb: 1 }}>
                          {ds.path}
                        </Typography>
                        <Chip size="small" label={ds.use_case} sx={{ textTransform: "capitalize", height: 22, fontSize: "11px" }} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );
      })}
    </Box>
  );
}


