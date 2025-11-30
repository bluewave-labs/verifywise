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

  const handleCreateScorer = async () => {
    try {
      const payload = {
        projectId,
        name: "Answer correctness (LLM)",
        description: "Default scorer template measuring answer correctness with an LLM judge.",
        type: "llm" as const,
        metricKey: "answer_correctness",
        config: {
          judgeModel: "gpt-4o-mini",
          scale: "0-1",
          rubric:
            "Score how correct the assistant's answer is relative to the reference answer. Return a number between 0 and 1.",
        },
        enabled: true,
        defaultThreshold: 0.7,
        weight: 1.0,
      };
      await deepEvalScorersService.create(payload);
      setAlert({ variant: "success", body: "Scorer created" });
      setTimeout(() => setAlert(null), 3000);
      void loadScorers();
    } catch (err) {
      console.error("Failed to create scorer", err);
      setAlert({ variant: "error", body: "Failed to create scorer" });
      setTimeout(() => setAlert(null), 4000);
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
          onClick={handleCreateScorer}
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
    </Box>
  );
}

