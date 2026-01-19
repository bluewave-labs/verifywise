import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
} from "@mui/material";
import SearchBox from "../../components/Search/SearchBox";
import { FilterBy, type FilterColumn } from "../../components/Table/FilterBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";
import { evalModelPreferencesService, type SavedModelConfig } from "../../../infrastructure/api/evalModelPreferencesService";
import Alert from "../../components/Alert";
import StandardModal from "../../components/Modals/StandardModal";
import ModelsTable, { type ModelRow } from "../../components/Table/ModelsTable";
import HelperIcon from "../../components/HelperIcon";
import TipBox from "../../components/TipBox";
import { useAuth } from "../../../application/hooks/useAuth";
import allowedRoles from "../../../application/constants/permissions";

export interface ModelsPageProps {
  orgId?: string | null;
  onNavigateToProject?: (projectId: string) => void;
}

interface AlertState {
  variant: "success" | "error";
  body: string;
}

export default function ModelsPage({ orgId, onNavigateToProject }: ModelsPageProps) {
  const [models, setModels] = useState<SavedModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null);

  // RBAC permissions
  const { userRoleName } = useAuth();
  const canDeleteModel = allowedRoles.evals.deleteScorer?.includes(userRoleName) ?? true;

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<ModelRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadModels = useCallback(async () => {
    try {
      setLoading(true);
      const allPrefs = await evalModelPreferencesService.getAllPreferences();
      setModels(allPrefs);
    } catch (err) {
      console.error("Failed to load models", err);
      setAlert({ variant: "error", body: "Failed to load models" });
      setTimeout(() => setAlert(null), 4000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadModels();
  }, [orgId, loadModels]);

  const filterColumns: FilterColumn[] = useMemo(
    () => [
      { id: "projectName", label: "Project", type: "text" },
      { id: "modelName", label: "Model", type: "text" },
      { id: "modelProvider", label: "Provider", type: "text" },
    ],
    []
  );

  const getFieldValue = useCallback(
    (
      m: SavedModelConfig,
      fieldId: string
    ): string | number | Date | null | undefined => {
      switch (fieldId) {
        case "projectName":
          return m.projectName;
        case "modelName":
          return m.model.name;
        case "modelProvider":
          return m.model.accessMethod;
        default:
          return "";
      }
    },
    []
  );

  const { filterData, handleFilterChange } =
    useFilterBy<SavedModelConfig>(getFieldValue);

  const filteredModels = useMemo(() => {
    const afterFilter = filterData(models);
    if (!searchTerm.trim()) return afterFilter;
    const q = searchTerm.toLowerCase();
    return afterFilter.filter((m) =>
      [m.projectName, m.model.name, m.model.accessMethod, m.judgeLlm.provider, m.judgeLlm.model]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [models, filterData, searchTerm]);

  // Convert SavedModelConfig to ModelRow for the table
  const modelRows: ModelRow[] = useMemo(() => {
    return filteredModels.map((m) => ({
      id: m.id,
      projectId: m.projectId,
      projectName: m.projectName,
      modelName: m.model.name,
      modelProvider: m.model.accessMethod,
      judgeProvider: m.judgeLlm.provider,
      judgeModel: m.judgeLlm.model,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }, [filteredModels]);

  // Row click handler - navigate to project
  const handleRowClick = useCallback((row: ModelRow) => {
    if (onNavigateToProject) {
      onNavigateToProject(row.projectId);
    }
  }, [onNavigateToProject]);

  // Delete handler from menu
  const handleDelete = useCallback((row: ModelRow) => {
    setModelToDelete(row);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!modelToDelete) return;
    setIsDeleting(true);
    try {
      const success = await evalModelPreferencesService.deletePreferences(modelToDelete.projectId);
      if (success) {
        setAlert({ variant: "success", body: "Model configuration deleted" });
        setTimeout(() => setAlert(null), 3000);
        setDeleteModalOpen(false);
        setModelToDelete(null);
        void loadModels();
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      console.error("Failed to delete model", err);
      setAlert({ variant: "error", body: "Failed to delete model" });
      setTimeout(() => setAlert(null), 4000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      {/* Header + description */}
      <Stack spacing={1} mb={4}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" fontSize={15} fontWeight="600" color="#111827">
            Models
          </Typography>
          <HelperIcon articlePath="llm-evals/models" />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: "14px" }}>
          View and manage model configurations. These preferences are automatically saved when you run an experiment and auto-loaded for new experiments in the same project.
        </Typography>
        <TipBox entityName="evals-models" />
      </Stack>

      {/* Controls row */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ marginBottom: "18px" }}
        gap={2}
      >
        <Stack direction="row" alignItems="center" gap={2}>
          <FilterBy columns={filterColumns} onFilterChange={handleFilterChange} />
          <SearchBox
            placeholder="Search models..."
            value={searchTerm}
            onChange={setSearchTerm}
            inputProps={{ "aria-label": "Search models" }}
            fullWidth={false}
          />
        </Stack>
      </Stack>

      {/* Models table */}
      <Box mb={4}>
        <ModelsTable
          rows={modelRows}
          onRowClick={onNavigateToProject ? handleRowClick : undefined}
          onDelete={canDeleteModel ? handleDelete : undefined}
          loading={loading}
        />
      </Box>

      {/* Delete Confirmation Modal */}
      <StandardModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setModelToDelete(null);
        }}
        title="Delete model"
        description={`Are you sure you want to delete the model configuration for "${modelToDelete?.projectName || "this project"}"? This will reset the model preferences for this project.`}
        onSubmit={handleConfirmDelete}
        submitButtonText="Delete"
        isSubmitting={isDeleting}
        submitButtonColor="#c62828"
      />
    </Box>
  );
}
