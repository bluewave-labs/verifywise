import { useEffect, useState } from "react";
import { Box, Typography, Button, Stack, Table, TableHead, TableRow, TableCell, TableBody, IconButton } from "@mui/material";
import { deepEvalDatasetsService } from "../../../infrastructure/api/deepEvalDatasetsService";
import Alert from "../../components/Alert";
import { Database, Eye } from "lucide-react";
import StandardModal from "../../components/Modals/StandardModal";
// no navigation needed when embedded
// import { useNavigate } from "react-router-dom";
import BuiltInDatasetsPage from "./BuiltInDatasetsPage";
import DatasetEditorPage from "./DatasetEditorPage";

type ProjectDatasetsProps = { projectId: string };

// kept for reference previously; no longer needed after moving built-ins to a page
// type ListedDataset = { key: string; name: string; path: string; use_case: "chatbot" | "rag" | "agent" | "safety" };

export function ProjectDatasets(_props: ProjectDatasetsProps) {
  const { projectId } = _props;
  // const navigate = useNavigate();
  void projectId;
  const [uploads, setUploads] = useState<{ id?: number; name: string; path: string; size: number; createdAt?: string; modifiedAt?: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);
  // Built-ins are now shown in a dedicated page; no local modal/state needed
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"uploads" | "builtin" | "editor">("uploads");
  const [editorPath, setEditorPath] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await deepEvalDatasetsService.listMy();
      setUploads(res.datasets || []);
    } catch (e) {
      setAlert({ variant: "error", body: e instanceof Error ? e.message : "Failed to load uploads" });
      setTimeout(() => setAlert(null), 6000);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Box sx={{ userSelect: "none" }}>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ mb: 2 }}>
        {uploads.length > 0 && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              disabled={uploading}
              sx={{ textTransform: "none" }}
              onClick={() => setUploadOpen(true)}
            >
              Upload dataset
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Database size={16} />}
              onClick={() => setMode("builtin")}
            >
              Browse built‑in
            </Button>
          </Stack>
        )}
      </Stack>

      {mode === "builtin" && (
        <Box sx={{ mt: 1 }}>
          <BuiltInDatasetsPage
            embed
            onOpenEditor={(path: string) => {
              setEditorPath(path);
              setMode("editor");
            }}
          />
        </Box>
      )}
      {mode === "editor" && editorPath && (
        <Box sx={{ mt: 1 }}>
          <DatasetEditorPage embed initialPath={editorPath} />
        </Box>
      )}
      {mode === "uploads" && (uploads.length === 0 ? (
        <Box
          sx={{
            border: "1px dashed #D1D5DB",
            borderRadius: "10px",
            p: 6,
            textAlign: "center",
            bgcolor: "#FAFBFC",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "16px", mb: 1 }}>
            Get started with datasets
          </Typography>
          <Typography variant="body2" sx={{ color: "#6B7280", mb: 2, fontSize: "13px" }}>
            Store evaluation test cases and reuse them across experiments. Upload your own dataset or browse our built‑ins.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button variant="contained" onClick={() => setUploadOpen(true)}>Upload dataset</Button>
            <Button variant="outlined" startIcon={<Database size={16} />} onClick={() => setMode("builtin")}>
              Browse built‑in
            </Button>
          </Stack>
        </Box>
      ) : (
      <Table size="small" sx={{ border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden" }}>
          <TableHead>
            <TableRow sx={{ background: "#F9FAFB" }}>
              <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>File</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Path</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Size</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Created</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: "12px" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {uploads.map((u) => (
              <TableRow key={u.path} hover>
                <TableCell sx={{ fontSize: "13px" }}>{u.name}</TableCell>
                <TableCell sx={{ fontFamily: "monospace", fontSize: "12px" }}>{u.path}</TableCell>
                <TableCell sx={{ fontSize: "12px" }}>{(u.size / 1024).toFixed(1)} KB</TableCell>
                <TableCell sx={{ fontSize: "12px" }}>{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" title="Preview structure" onClick={() => window.open(`/api/deepeval/datasets/read?path=${encodeURIComponent(u.path)}`, "_blank")}>
                    <Eye size={16} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </Table>
      ))}

      <StandardModal
        isOpen={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setFile(null);
        }}
        title="Upload dataset"
        description="Upload a JSON dataset (single‑turn or conversational). It will be saved to your project's datasets."
        onSubmit={async () => {
          if (!file) return;
          try {
            setUploading(true);
            const resp = await deepEvalDatasetsService.uploadDataset(file);
            setAlert({ variant: "success", body: `Uploaded ${resp.filename}` });
            setTimeout(() => setAlert(null), 4000);
            setUploadOpen(false);
            setFile(null);
            await load();
          } catch (err) {
            setAlert({ variant: "error", body: err instanceof Error ? err.message : "Upload failed" });
            setTimeout(() => setAlert(null), 6000);
          } finally {
            setUploading(false);
          }
        }}
        submitButtonText={uploading ? "Uploading..." : "Upload"}
        isSubmitting={uploading}
      >
        <Stack spacing={2}>
          <Typography variant="body2" sx={{ color: "#6B7280" }}>
            Choose a JSON file formatted like our presets. For conversational datasets, provide an array of scenarios with {"{ role, content }"} turns.
          </Typography>
          <Button variant="outlined" component="label" size="small" sx={{ textTransform: "none", alignSelf: "flex-start" }}>
            {file ? "Choose another file" : "Choose JSON file"}
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
              }}
            />
          </Button>
          <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
            {file ? `Selected: ${file.name}` : "No file selected"}
          </Typography>
        </Stack>
      </StandardModal>
    </Box>
  );
}


