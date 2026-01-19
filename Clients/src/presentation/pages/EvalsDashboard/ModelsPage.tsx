import { useEffect, useMemo, useState, useCallback } from "react";
import {
    Box,
    Stack,
    Typography,
    Card,
    CardContent,
    Grid,
    Select,
    MenuItem,
    FormControl,
    Chip as MuiChip,
} from "@mui/material";
import { Plus, Check } from "lucide-react";
import CustomizableButton from "../../components/Button/CustomizableButton";
import SearchBox from "../../components/Search/SearchBox";
import { FilterBy, type FilterColumn } from "../../components/Table/FilterBy";
import { GroupBy } from "../../components/Table/GroupBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";
import { evalModelPreferencesService, type SavedModelConfig } from "../../../infrastructure/api/evalModelPreferencesService";
import Alert from "../../components/Alert";
import StandardModal from "../../components/Modals/StandardModal";
import ModelsTable, { type ModelRow } from "../../components/Table/ModelsTable";
import HelperIcon from "../../components/HelperIcon";
import TipBox from "../../components/TipBox";
import Field from "../../components/Inputs/Field";
import { useAuth } from "../../../application/hooks/useAuth";
import allowedRoles from "../../../application/constants/permissions";
import { PROVIDERS } from "../../utils/providers";

// Import provider logos
import { ReactComponent as OpenAILogo } from "../../assets/icons/openai_logo.svg";
import { ReactComponent as AnthropicLogo } from "../../assets/icons/anthropic_logo.svg";
import { ReactComponent as HuggingFaceLogo } from "../../assets/icons/huggingface_logo.svg";
import { ReactComponent as OllamaLogo } from "../../assets/icons/ollama_logo.svg";
import { ReactComponent as GeminiLogo } from "../../assets/icons/gemini_logo.svg";
import { ReactComponent as MistralLogo } from "../../assets/icons/mistral_logo.svg";
import { ReactComponent as XAILogo } from "../../assets/icons/xai_logo.svg";
import { ReactComponent as OpenRouterLogo } from "../../assets/icons/openrouter_logo.svg";
import { ReactComponent as BuildIcon } from "../../assets/icons/build.svg";

// Provider definitions for the model selector
const MODEL_PROVIDERS = [
    { id: "openrouter", name: "OpenRouter", Logo: OpenRouterLogo },
    { id: "openai", name: "OpenAI", Logo: OpenAILogo },
    { id: "anthropic", name: "Anthropic", Logo: AnthropicLogo },
    { id: "google", name: "Gemini", Logo: GeminiLogo },
    { id: "xai", name: "xAI", Logo: XAILogo },
    { id: "mistral", name: "Mistral", Logo: MistralLogo },
    { id: "huggingface", name: "Hugging Face", Logo: HuggingFaceLogo },
    { id: "ollama", name: "Ollama", Logo: OllamaLogo },
    { id: "custom", name: "Custom", Logo: BuildIcon },
];

export interface ModelsPageProps {
    orgId?: string | null;
    onNavigateToProject?: (projectId: string) => void;
}

interface AlertState {
    variant: "success" | "error";
    body: string;
}

interface NewModelConfig {
    accessMethod: string;
    modelName: string;
    endpointUrl: string;
}

export default function ModelsPage({ orgId, onNavigateToProject }: ModelsPageProps) {
    const [models, setModels] = useState<SavedModelConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [alert, setAlert] = useState<AlertState | null>(null);

    // RBAC permissions
    const { userRoleName } = useAuth();
    const canDeleteModel = allowedRoles.evals.deleteScorer?.includes(userRoleName) ?? true;
    const canCreateModel = allowedRoles.evals.createScorer?.includes(userRoleName) ?? true;

    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [modelToDelete, setModelToDelete] = useState<ModelRow | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // New model modal state
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newModel, setNewModel] = useState<NewModelConfig>({
        accessMethod: "",
        modelName: "",
        endpointUrl: "",
    });

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
            { id: "modelName", label: "Name", type: "text" },
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
            [m.model.name, m.model.accessMethod]
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

    // Handle adding a new model
    const handleAddModel = () => {
        setNewModel({
            accessMethod: "",
            modelName: "",
            endpointUrl: "",
        });
        setAddModalOpen(true);
    };

    const handleSaveNewModel = async () => {
        if (!newModel.accessMethod || !newModel.modelName) {
            setAlert({ variant: "error", body: "Please select a provider and model" });
            setTimeout(() => setAlert(null), 4000);
            return;
        }

        setIsSaving(true);
        try {
            // Generate a unique project ID for standalone models
            const projectId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const success = await evalModelPreferencesService.savePreferences({
                projectId,
                model: {
                    name: newModel.modelName,
                    accessMethod: newModel.accessMethod,
                    endpointUrl: newModel.endpointUrl || undefined,
                },
                judgeLlm: {
                    provider: "openai",
                    model: "gpt-4o",
                    temperature: 0.7,
                    maxTokens: 2048,
                },
            });

            if (success) {
                setAlert({ variant: "success", body: "Model added successfully" });
                setTimeout(() => setAlert(null), 3000);
                setAddModalOpen(false);
                void loadModels();
            } else {
                throw new Error("Save failed");
            }
        } catch (err) {
            console.error("Failed to add model", err);
            setAlert({ variant: "error", body: "Failed to add model" });
            setTimeout(() => setAlert(null), 4000);
        } finally {
            setIsSaving(false);
        }
    };

    // Get available models for selected provider
    const availableModels = useMemo(() => {
        if (!newModel.accessMethod || newModel.accessMethod === "custom" || newModel.accessMethod === "ollama") {
            return [];
        }
        return PROVIDERS[newModel.accessMethod]?.models || [];
    }, [newModel.accessMethod]);

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
                    <GroupBy
                        options={[
                            { id: "modelProvider", label: "Provider" },
                        ]}
                        onGroupChange={() => { }}
                    />
                    <SearchBox
                        placeholder="Search models..."
                        value={searchTerm}
                        onChange={setSearchTerm}
                        inputProps={{ "aria-label": "Search models" }}
                        fullWidth={false}
                    />
                </Stack>
                <CustomizableButton
                    variant="contained"
                    text="New model"
                    icon={<Plus size={16} />}
                    sx={{
                        backgroundColor: "#13715B",
                        border: "1px solid #13715B",
                        gap: 2,
                    }}
                    onClick={handleAddModel}
                    isDisabled={loading || !canCreateModel}
                />
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
                description={`Are you sure you want to delete "${modelToDelete?.modelName || "this model"}"? This action cannot be undone.`}
                onSubmit={handleConfirmDelete}
                submitButtonText="Delete"
                isSubmitting={isDeleting}
                submitButtonColor="#c62828"
            />

            {/* Add Model Modal */}
            <StandardModal
                isOpen={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                title="Add Model"
                description="Configure a new model for evaluation experiments."
                onSubmit={handleSaveNewModel}
                submitButtonText="Save"
                isSubmitting={isSaving}
                submitButtonColor="#13715B"
                maxWidth="md"
            >
                <Stack spacing={4}>
                    {/* Provider Selection */}
                    <Box>
                        <Typography sx={{ mb: 2.5, fontSize: "14px", fontWeight: 500, color: "#374151" }}>
                            Model provider
                        </Typography>
                        <Grid container spacing={1.5}>
                            {MODEL_PROVIDERS.map((provider) => {
                                const { Logo } = provider;
                                const isSelected = newModel.accessMethod === provider.id;

                                return (
                                    <Grid size={{ xs: 4, sm: 3 }} key={provider.id}>
                                        <Card
                                            onClick={() =>
                                                setNewModel((prev) => ({
                                                    ...prev,
                                                    accessMethod: provider.id,
                                                    modelName: "",
                                                }))
                                            }
                                            sx={{
                                                cursor: "pointer",
                                                border: "1px solid",
                                                borderColor: isSelected ? "#13715B" : "#E5E7EB",
                                                backgroundColor: "#FFFFFF",
                                                boxShadow: "none",
                                                transition: "all 0.2s ease",
                                                position: "relative",
                                                height: "100%",
                                                "&:hover": {
                                                    borderColor: "#13715B",
                                                    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                                                },
                                            }}
                                        >
                                            <CardContent
                                                sx={{
                                                    textAlign: "center",
                                                    py: 3,
                                                    px: 2,
                                                    height: "100%",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    "&:last-child": { pb: 3 },
                                                }}
                                            >
                                                {isSelected && (
                                                    <Box
                                                        sx={{
                                                            position: "absolute",
                                                            top: 8,
                                                            right: 8,
                                                            backgroundColor: "#13715B",
                                                            borderRadius: "50%",
                                                            width: 20,
                                                            height: 20,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                                                    </Box>
                                                )}

                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        width: 40,
                                                        height: 40,
                                                        mb: 1.5,
                                                        "& svg": {
                                                            width: 32,
                                                            height: 32,
                                                        },
                                                    }}
                                                >
                                                    <Logo />
                                                </Box>

                                                <Typography
                                                    sx={{
                                                        fontSize: "12px",
                                                        fontWeight: isSelected ? 600 : 500,
                                                        color: isSelected ? "#13715B" : "#374151",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {provider.name}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>

                    {/* Model Selection */}
                    {newModel.accessMethod && (
                        <Box>
                            <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151", mb: 1 }}>
                                Model
                            </Typography>

                            {newModel.accessMethod === "openrouter" ? (
                                /* OpenRouter - Custom model input with suggestions */
                                <Box>
                                    <Typography sx={{ fontSize: "11px", color: "#6b7280", mb: 1.5 }}>
                                        OpenRouter supports any model. Enter the model ID or select from popular options.
                                    </Typography>
                                    <Field
                                        label=""
                                        value={newModel.modelName}
                                        onChange={(e) => setNewModel((prev) => ({ ...prev, modelName: e.target.value }))}
                                        placeholder="e.g., openai/gpt-4o, anthropic/claude-3-opus"
                                    />
                                    <Typography sx={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", mt: 2, mb: 1, textTransform: "uppercase" }}>
                                        Popular Models
                                    </Typography>
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {[
                                            { id: "openai/gpt-4o", name: "GPT-4o" },
                                            { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
                                            { id: "google/gemini-pro-1.5", name: "Gemini Pro 1.5" },
                                            { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B" },
                                            { id: "mistralai/mistral-large", name: "Mistral Large" },
                                        ].map((m) => (
                                            <MuiChip
                                                key={m.id}
                                                label={m.name}
                                                variant={newModel.modelName === m.id ? "filled" : "outlined"}
                                                onClick={() => setNewModel((prev) => ({ ...prev, modelName: m.id }))}
                                                sx={{
                                                    cursor: "pointer",
                                                    backgroundColor: newModel.modelName === m.id ? "#E8F5F1" : "transparent",
                                                    borderColor: newModel.modelName === m.id ? "#13715B" : "#E5E7EB",
                                                    color: newModel.modelName === m.id ? "#13715B" : "#374151",
                                                    "&:hover": {
                                                        backgroundColor: newModel.modelName === m.id ? "#E8F5F1" : "#f9fafb",
                                                        borderColor: "#13715B",
                                                    },
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                </Box>
                            ) : newModel.accessMethod === "ollama" || newModel.accessMethod === "custom" ? (
                                /* Ollama/Custom - Text input */
                                <Box>
                                    <Typography sx={{ fontSize: "11px", color: "#6b7280", mb: 1.5 }}>
                                        {newModel.accessMethod === "ollama"
                                            ? "Enter the name of your locally running Ollama model."
                                            : "Enter the model identifier for your custom endpoint."}
                                    </Typography>
                                    <Field
                                        label=""
                                        value={newModel.modelName}
                                        onChange={(e) => setNewModel((prev) => ({ ...prev, modelName: e.target.value }))}
                                        placeholder={newModel.accessMethod === "ollama" ? "e.g., llama3.2, mistral" : "e.g., my-custom-model"}
                                    />
                                    {newModel.accessMethod === "custom" && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151", mb: 1 }}>
                                                Endpoint URL
                                            </Typography>
                                            <Field
                                                label=""
                                                value={newModel.endpointUrl}
                                                onChange={(e) => setNewModel((prev) => ({ ...prev, endpointUrl: e.target.value }))}
                                                placeholder="https://your-api-endpoint.com/v1"
                                            />
                                        </Box>
                                    )}
                                </Box>
                            ) : availableModels.length > 0 ? (
                                /* Standard providers - Dropdown */
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={newModel.modelName}
                                        onChange={(e) => setNewModel((prev) => ({ ...prev, modelName: e.target.value }))}
                                        displayEmpty
                                        sx={{ backgroundColor: "#fff" }}
                                    >
                                        <MenuItem value="" disabled>
                                            Select a model
                                        </MenuItem>
                                        {availableModels.map((model) => (
                                            <MenuItem key={model.id} value={model.id}>
                                                {model.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : (
                                /* Fallback text input */
                                <Field
                                    label=""
                                    value={newModel.modelName}
                                    onChange={(e) => setNewModel((prev) => ({ ...prev, modelName: e.target.value }))}
                                    placeholder="Enter model name"
                                />
                            )}
                        </Box>
                    )}
                </Stack>
            </StandardModal>
        </Box>
    );
}
