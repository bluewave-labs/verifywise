import { useEffect, useMemo, useState, useCallback } from "react";
import { Box, Stack } from "@mui/material";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { Play } from "lucide-react";
import EvaluationTable from "../../components/Table/EvaluationTable";
import type { IEvaluationRow } from "../../../domain/interfaces/i.table";
import SearchBox from "../../components/Search/SearchBox";
import { FilterBy, type FilterColumn } from "../../components/Table/FilterBy";
import { GroupBy } from "../../components/Table/GroupBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";
import { deepEvalScorersService, type DeepEvalScorer } from "../../../infrastructure/api/deepEvalScorersService";
import Alert from "../../components/Alert";
import ModalStandard from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";

export interface ProjectScorersProps {
  projectId: string;
}

interface AlertState {
  variant: "success" | "error";
  body: string;
}

export default function ProjectScorers({ projectId }: ProjectScorersProps) {
  const [scorers, setScorers] = useState<DeepEvalScorer[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [metricKeyTouched, setMetricKeyTouched] = useState(false);
  const [form, setForm] = useState({
    name: "",
    metricKey: "",
    description: "",
    type: "llm" as const,
    judgeModel: "gpt-4o-mini",
    defaultThreshold: "0.7",
    weight: "1.0",
  });

  const loadScorers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await deepEvalScorersService.list({ project_id: projectId });
      setScorers(res.scorers || []);
    } catch (err) {
      console.error("Failed to load scorers", err);
      setAlert({ variant: "error", body: "Failed to load scorers" });
      setTimeout(() => setAlert(null), 4000);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    void loadScorers();
  }, [projectId, loadScorers]);

  const filterColumns: FilterColumn[] = useMemo(
    () => [
      { id: "name", label: "Scorer name", type: "text" },
      { id: "metricKey", label: "Metric key", type: "text" },
      {
        id: "type",
        label: "Type",
        type: "select",
        options: [
          { value: "llm", label: "LLM" },
          { value: "builtin", label: "Builtin" },
          { value: "custom", label: "Custom" },
        ],
      },
    ],
    []
  );

  const getFieldValue = useCallback(
    (s: DeepEvalScorer, fieldId: string): string | number | Date | null | undefined => {
      switch (fieldId) {
        case "name":
          return s.name;
        case "metricKey":
          return s.metricKey;
        case "type":
          return s.type;
        default:
          return "";
      }
    },
    []
  );

  const { filterData, handleFilterChange } = useFilterBy<DeepEvalScorer>(getFieldValue);

  const filteredScorers = useMemo(() => {
    const afterFilter = filterData(scorers);
    if (!searchTerm.trim()) return afterFilter;
    const q = searchTerm.toLowerCase();
    return afterFilter.filter((s) =>
      [s.name, s.metricKey, s.type].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [scorers, filterData, searchTerm]);

  const tableColumns = ["SCORER", "MODEL / JUDGE", "TYPE", "METRIC", "STATUS", "REPORT", "ACTION"];

  const tableRows: IEvaluationRow[] = filteredScorers.map((s) => ({
    id: s.id,
    name: s.name,
    model: s.config?.judgeModel || s.config?.model || s.metricKey || "Scorer",
    judge: s.type.toUpperCase(),
    dataset: s.metricKey,
    // Use Completed/Pending so we reuse existing status chip styling
    status: s.enabled ? "Completed" : "Pending",
  }));

  const handleViewScorer = (row: IEvaluationRow) => {
    // For first iteration, just log; future work can open detailed config drawer
    console.debug("View scorer", row.id);
  };

  const handleDeleteScorer = async (scorerId: string) => {
    try {
      await deepEvalScorersService.delete(scorerId);
      setAlert({ variant: "success", body: "Scorer deleted" });
      setTimeout(() => setAlert(null), 3000);
      void loadScorers();
    } catch (err) {
      console.error("Failed to delete scorer", err);
      setAlert({ variant: "error", body: "Failed to delete scorer" });
      setTimeout(() => setAlert(null), 4000);
    }
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => {
      const next = { ...prev, name: value };
      if (!metricKeyTouched) {
        const autoKey = value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
        next.metricKey = autoKey;
      }
      return next;
    });
  };

  const handleMetricKeyChange = (value: string) => {
    setMetricKeyTouched(true);
    setForm((prev) => ({ ...prev, metricKey: value }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      metricKey: "",
      description: "",
      type: "llm",
      judgeModel: "gpt-4o-mini",
      defaultThreshold: "0.7",
      weight: "1.0",
    });
    setMetricKeyTouched(false);
  };

  const handleCreateScorer = async () => {
    if (!form.name.trim() || !form.metricKey.trim()) {
      setAlert({
        variant: "error",
        body: "Name and metric key are required.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    try {
      setCreating(true);
      const payload = {
        projectId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        metricKey: form.metricKey.trim(),
        config: {
          judgeModel: form.judgeModel.trim() || "gpt-4o-mini",
          scale: "0-1",
          rubric:
            "Score how correct the assistant's answer is relative to the reference answer. Return a number between 0 and 1.",
        },
        enabled: true,
        defaultThreshold: Number.isNaN(Number(form.defaultThreshold)) ? 0.7 : Number(form.defaultThreshold),
        weight: Number.isNaN(Number(form.weight)) ? 1.0 : Number(form.weight),
      };

      await deepEvalScorersService.create(payload);
      setAlert({ variant: "success", body: "Scorer created" });
      setTimeout(() => setAlert(null), 3000);
      setCreateOpen(false);
      resetForm();
      void loadScorers();
    } catch (err) {
      console.error("Failed to create scorer", err);
      setAlert({ variant: "error", body: "Failed to create scorer" });
      setTimeout(() => setAlert(null), 4000);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      {/* Controls row */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} gap={2}>
        <Stack direction="row" alignItems="center" gap={2}>
          <FilterBy columns={filterColumns} onFilterChange={handleFilterChange} />
          <GroupBy
            options={[
              { id: "type", label: "Type" },
              { id: "metricKey", label: "Metric key" },
            ]}
            onGroupChange={() => {
              /* Grouped view can be added later; UI is consistent already */
            }}
          />
          <SearchBox
            placeholder="Search scorers..."
            value={searchTerm}
            onChange={setSearchTerm}
            inputProps={{ "aria-label": "Search scorers" }}
            fullWidth={false}
          />
        </Stack>
        <CustomizableButton
          variant="contained"
          text="New scorer"
          icon={<Play size={16} />}
          sx={{
            backgroundColor: "#13715B",
            border: "1px solid #13715B",
            gap: 2,
          }}
          onClick={() => setCreateOpen(true)}
          isDisabled={loading}
        />
      </Stack>

      {/* Scorers table */}
      <Box mb={4}>
        <EvaluationTable
          columns={tableColumns}
          rows={tableRows}
          removeModel={{
            onConfirm: handleDeleteScorer,
          }}
          page={page}
          setCurrentPagingation={setPage}
          onShowDetails={handleViewScorer}
        />
      </Box>

      <ModalStandard
        isOpen={createOpen}
        onClose={() => {
          if (creating) return;
          setCreateOpen(false);
          resetForm();
        }}
        title="New scorer"
        description="Create a new scorer for this project. Metric keys are used to join scores back to experiment results."
        onSubmit={handleCreateScorer}
        submitButtonText="Create"
        isSubmitting={creating}
      >
        <Stack spacing={6}>
          <Stack direction="row" spacing={6}>
            <Field
              label="Name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Scorer name"
              isRequired
              width="100%"
            />
            <Field
              label="Metric key"
              value={form.metricKey}
              onChange={(e) => handleMetricKeyChange(e.target.value)}
              placeholder="e.g. answer_correctness"
              isRequired
              width="100%"
            />
          </Stack>

          <Field
            type="description"
            label="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Optional description"
            isOptional
          />

          <Stack direction="row" spacing={6}>
            <Field
              label="Type"
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as typeof prev.type }))}
              placeholder="llm"
              width="100%"
            />
            <Field
              label="Judge model"
              value={form.judgeModel}
              onChange={(e) => setForm((prev) => ({ ...prev, judgeModel: e.target.value }))}
              placeholder="gpt-4o-mini"
              width="100%"
            />
          </Stack>

          <Stack direction="row" spacing={6}>
            <Field
              label="Default threshold"
              type="number"
              value={form.defaultThreshold}
              onChange={(e) => setForm((prev) => ({ ...prev, defaultThreshold: e.target.value }))}
              placeholder="0.7"
              width="100%"
            />
            <Field
              label="Weight"
              type="number"
              value={form.weight}
              onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
              placeholder="1.0"
              width="100%"
            />
          </Stack>
        </Stack>
      </ModalStandard>
    </Box>
  );
}
