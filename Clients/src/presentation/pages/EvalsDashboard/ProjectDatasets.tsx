import { useEffect, useState, useMemo, useCallback } from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import { deepEvalDatasetsService } from "../../../infrastructure/api/deepEvalDatasetsService";
import Alert from "../../components/Alert";
import { Database } from "lucide-react";
import StandardModal from "../../components/Modals/StandardModal";
// no navigation needed when embedded
// import { useNavigate } from "react-router-dom";
import BuiltInDatasetsPage from "./BuiltInDatasetsPage";
import DatasetEditorPage from "./DatasetEditorPage";
import EvaluationTable from "../../components/Table/EvaluationTable";
import type { IEvaluationRow } from "../../../domain/interfaces/i.table";
import SearchBox from "../../components/Search/SearchBox";
import { FilterBy, type FilterColumn } from "../../components/Table/FilterBy";
import { GroupBy } from "../../components/Table/GroupBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";

type ProjectDatasetsProps = { projectId: string };

type UploadedDataset = {
  id?: number;
  name: string;
  path: string;
  size: number;
  promptCount?: number;
  createdAt?: string;
};

export function ProjectDatasets(_props: ProjectDatasetsProps) {
  const { projectId } = _props;
  void projectId;
  const [uploads, setUploads] = useState<UploadedDataset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"uploads" | "builtin" | "editor">("uploads");
  const [editorPath, setEditorPath] = useState<string | null>(null);
  const [editorDatasetName, setEditorDatasetName] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filter configuration (shared FilterBy component)
  const datasetFilterColumns: FilterColumn[] = useMemo(
    () => [
      { id: "name", label: "Dataset name", type: "text" },
      { id: "path", label: "Path", type: "text" },
    ],
    []
  );

  const getDatasetFieldValue = useCallback(
    (u: UploadedDataset, fieldId: string): string | number | Date | null | undefined => {
      switch (fieldId) {
        case "name":
          return u.name;
        case "path":
          return u.path;
        default:
          return "";
      }
    },
    []
  );

  const { filterData, handleFilterChange } = useFilterBy<UploadedDataset>(getDatasetFieldValue);

  const filteredUploads = useMemo(() => {
    const afterFilter = filterData(uploads);
    if (!searchTerm.trim()) return afterFilter;
    const q = searchTerm.toLowerCase();
    return afterFilter.filter((u) =>
      [u.name, u.path].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [uploads, filterData, searchTerm]);

  const datasetRows: IEvaluationRow[] = useMemo(
    () =>
      filteredUploads.map<IEvaluationRow>((u) => ({
        id: u.path,
        name: u.name,
        // Use model/ judge / dataset fields to match EvaluationTable expectations
        model: u.name,
        judge: u.promptCount !== undefined ? String(u.promptCount) : "—",
        dataset: u.promptCount !== undefined ? `${u.promptCount} prompts` : "—",
        status: "Completed",
      })),
    [filteredUploads]
  );

  const handleOpenDataset = (row: IEvaluationRow) => {
    setEditorPath(String(row.id));
    setEditorDatasetName(row.name || row.model || row.id);
    setMode("editor");
  };

  const handleDeleteDataset = async (datasetId: string) => {
    try {
      setUploading(true);
      await deepEvalDatasetsService.deleteDatasets([datasetId]);
      setAlert({ variant: "success", body: "Deleted 1 dataset" });
      setTimeout(() => setAlert(null), 3000);
      await load();
    } catch (err) {
      setAlert({
        variant: "error",
        body: err instanceof Error ? err.message : "Failed to delete dataset",
      });
      setTimeout(() => setAlert(null), 6000);
    } finally {
      setUploading(false);
    }
  };

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
            onOpenEditor={(path: string, name: string) => {
              setEditorPath(path);
              setEditorDatasetName(`Copy of ${name}`);
              setMode("editor");
            }}
            onBack={() => setMode("uploads")}
          />
        </Box>
      )}
      {mode === "editor" && editorPath && (
        <Box sx={{ mt: 1 }}>
          <DatasetEditorPage 
            embed 
            initialPath={editorPath}
            isUserDataset={uploads.some(u => u.path === editorPath)}
            suggestedName={editorDatasetName}
            onSaved={() => {
              setMode("uploads");
              setEditorPath(null);
              setEditorDatasetName(null);
              load();
            }}
            onBack={() => {
              setMode("uploads");
              setEditorPath(null);
              setEditorDatasetName(null);
            }}
          />
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
        <>
          {/* Filters + Search + Group above the datasets table */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
            gap={2}
          >
            <Stack direction="row" alignItems="center" gap={2}>
              <FilterBy
                columns={datasetFilterColumns}
                onFilterChange={handleFilterChange}
              />
              <GroupBy
                options={[
                  { id: "name", label: "Dataset name" },
                ]}
                onGroupChange={() => {
                  /* Grouping behaviour for datasets can be added later */
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
          </Stack>

          <Box mb={4}>
            <EvaluationTable
              columns={[
                "DATASET",
                "DESCRIPTION",
                "PROMPTS",
                "STATUS",
                "OPEN",
                "ACTION",
              ]}
              rows={datasetRows}
              removeModel={{
                onConfirm: handleDeleteDataset,
              }}
              // Reuse first page for datasets; they are typically few
              page={0}
              setCurrentPagingation={() => {
                /* Pagination not needed for datasets yet */
              }}
              onShowDetails={handleOpenDataset}
            />
          </Box>
        </>
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
            type AxiosLike = { response?: { data?: unknown } };
            const axiosErr = err as AxiosLike | Error;
            const resData = (axiosErr as AxiosLike)?.response?.data as Record<string, unknown> | undefined;
            const serverMsg =
              (resData && (String(resData.message ?? "") || resData.detail as string)) ||
              (err instanceof Error ? err.message : null);
            setAlert({ variant: "error", body: serverMsg || "Upload failed (400). Ensure valid JSON (prompts/turns)." });
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


