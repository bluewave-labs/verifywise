import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  Collapse,
  useTheme,
} from "@mui/material";
import {
  Save,
  Send,
  Archive,
  Eye,
  Copy,
  Settings,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Pencil,
  PaintBucket,
} from "lucide-react";
import {
  getIntakeForm,
  createIntakeForm,
  updateIntakeForm,
  IntakeFormStatus,
  IntakeEntityType,
} from "../../../application/repository/intakeForm.repository";
import CustomAxios from "../../../infrastructure/api/customAxios";
import { LLMKeysModel } from "../../../domain/models/Common/llmKeys/llmKeys.model";
import { FieldPalette, SuggestedQuestionsPanel } from "./FieldPalette";
import { FormCanvas } from "./FormCanvas";
import { FieldEditor } from "./FieldEditor";
import { DesignPanel } from "./DesignPanel";
import CustomizableMultiSelect from "../../components/Inputs/Select/Multi";
import {
  FormField,
  FormDesignSettings,
  IntakeForm,
  createEmptyForm,
  generateFieldId,
  generateSlug,
  DEFAULT_DESIGN_SETTINGS,
} from "./types";
import { CustomizableButton } from "../../components/button/customizable-button";
import StandardModal from "../../components/Modals/StandardModal";
import Select from "../../components/Inputs/Select";
import Checkbox from "../../components/Inputs/Checkbox";
import Chip from "../../components/Chip";
import { PageBreadcrumbs } from "../../components/breadcrumbs/PageBreadcrumbs";

// ============================================================================
// Helpers
// ============================================================================

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}

// ============================================================================
// Main component
// ============================================================================

export function IntakeFormBuilder() {
  const { formId } = useParams<{ formId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();

  // --- Builder state ---
  const isEditing = Boolean(formId) && formId !== "new";
  const [builderMode, setBuilderMode] = useState<"edit" | "design">("edit");
  const [form, setForm] = useState<IntakeForm>(createEmptyForm());
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [llmKeys, setLlmKeys] = useState<LLMKeysModel[]>([]);
  const [formSettingsOpen, setFormSettingsOpen] = useState(true);
  const [orgUsers, setOrgUsers] = useState<
    Array<{ id: number; name: string; surname?: string; email: string }>
  >([]);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
  const [deleteFieldModalOpen, setDeleteFieldModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "info" });

  // ============================================================================
  // Data loading
  // ============================================================================

  // Load single form for the builder
  useEffect(() => {
    if (isEditing && formId) {
      setIsLoadingForm(true);
      getIntakeForm(parseInt(formId))
        .then((response) => {
          if (response.data) setForm(response.data);
        })
        .catch(() => {
          setSnackbar({
            open: true,
            message: "Failed to load form",
            severity: "error",
          });
        })
        .finally(() => setIsLoadingForm(false));
    } else if (formId === "new") {
      const entityTypeParam = searchParams.get("entityType");
      const entityType = entityTypeParam === IntakeEntityType.MODEL
        ? IntakeEntityType.MODEL
        : IntakeEntityType.USE_CASE;
      setForm(createEmptyForm(entityType));
      setSelectedFieldId(null);
      setIsDirty(false);
    }
  }, [formId, isEditing, searchParams]);

  // Load LLM keys & users (once)
  useEffect(() => {
    CustomAxios.get("/llm-keys")
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        setLlmKeys(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    CustomAxios.get("/users")
      .then((res) => {
        const users = res.data?.data || res.data || [];
        setOrgUsers(Array.isArray(users) ? users : []);
      })
      .catch(() => {});
  }, []);

  // ============================================================================
  // Builder handlers
  // ============================================================================

  const updateForm = useCallback((updates: Partial<IntakeForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  const updateField = useCallback((updatedField: FormField) => {
    setForm((prev) => ({
      ...prev,
      schema: {
        ...prev.schema,
        fields: prev.schema.fields.map((f) =>
          f.id === updatedField.id ? updatedField : f
        ),
      },
    }));
    setIsDirty(true);
  }, []);

  const addField = useCallback((field: FormField) => {
    setForm((prev) => ({
      ...prev,
      schema: { ...prev.schema, fields: [...prev.schema.fields, field] },
    }));
    setIsDirty(true);
    setSelectedFieldId(field.id);
  }, []);

  const requestDeleteField = useCallback((fId: string) => {
    setFieldToDelete(fId);
    setDeleteFieldModalOpen(true);
  }, []);

  const confirmDeleteField = useCallback(() => {
    if (!fieldToDelete) return;
    setForm((prev) => ({
      ...prev,
      schema: {
        ...prev.schema,
        fields: prev.schema.fields.filter((f) => f.id !== fieldToDelete),
      },
    }));
    setIsDirty(true);
    if (selectedFieldId === fieldToDelete) setSelectedFieldId(null);
    setFieldToDelete(null);
    setDeleteFieldModalOpen(false);
  }, [fieldToDelete, selectedFieldId]);

  const duplicateField = useCallback(
    (field: FormField) => {
      const newField: FormField = {
        ...field,
        id: generateFieldId(),
        label: `${field.label} (copy)`,
        order: form.schema.fields.length,
      };
      addField(newField);
    },
    [form.schema.fields.length, addField]
  );

  const moveFieldUp = useCallback((fId: string) => {
    setForm((prev) => {
      const index = prev.schema.fields.findIndex((f) => f.id === fId);
      if (index <= 0) return prev;
      return {
        ...prev,
        schema: {
          ...prev.schema,
          fields: arrayMove(prev.schema.fields, index, index - 1).map(
            (f, i) => ({ ...f, order: i })
          ),
        },
      };
    });
    setIsDirty(true);
  }, []);

  const moveFieldDown = useCallback((fId: string) => {
    setForm((prev) => {
      const index = prev.schema.fields.findIndex((f) => f.id === fId);
      if (index === -1 || index >= prev.schema.fields.length - 1) return prev;
      return {
        ...prev,
        schema: {
          ...prev.schema,
          fields: arrayMove(prev.schema.fields, index, index + 1).map(
            (f, i) => ({ ...f, order: i })
          ),
        },
      };
    });
    setIsDirty(true);
  }, []);

  const handleSave = async (): Promise<number | null> => {
    if (!form.name.trim()) {
      setSnackbar({
        open: true,
        message: "Form name is required",
        severity: "error",
      });
      return null;
    }
    setIsSaving(true);
    try {
      const formData = {
        ...form,
        slug: form.slug || generateSlug(form.name),
        recipients: form.recipients ?? [],
        riskTierSystem: form.riskTierSystem ?? "generic",
        llmKeyId: form.llmKeyId ?? null,
        suggestedQuestionsEnabled: form.suggestedQuestionsEnabled ?? false,
      };
      if (isEditing && formId) {
        const response = await updateIntakeForm(parseInt(formId), formData);
        const updatedData = response.data;
        if (updatedData) {
          setForm((prev) => ({ ...prev, ...updatedData }));
        }
        setSnackbar({
          open: true,
          message: "Form saved successfully",
          severity: "success",
        });
        setIsDirty(false);
        return parseInt(formId);
      } else {
        const response = await createIntakeForm(formData);
        if (response.data?.id) {
          setForm((prev) => ({ ...prev, ...response.data }));
          navigate(`/intake-forms/${response.data.id}/edit`, { replace: true });
          setSnackbar({
            open: true,
            message: "Form created successfully",
            severity: "success",
          });
          setIsDirty(false);
          return response.data.id;
        }
      }
      return null;
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to save form",
        severity: "error",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (form.schema.fields.length === 0) {
      setSnackbar({
        open: true,
        message: "Add at least one field before publishing",
        severity: "error",
      });
      return;
    }
    try {
      const savedId = await handleSave();
      if (savedId) {
        const publishResponse = await updateIntakeForm(savedId, { status: IntakeFormStatus.ACTIVE });
        const publishedData = publishResponse.data;
        setForm((prev) => ({
          ...prev,
          status: IntakeFormStatus.ACTIVE,
          ...(publishedData?.publicId ? { publicId: publishedData.publicId } : {}),
        }));
        setSnackbar({
          open: true,
          message: "Form published successfully",
          severity: "success",
        });
      }
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to publish form",
        severity: "error",
      });
    }
  };

  const handleArchiveBuilder = async () => {
    if (!formId || formId === "new") return;
    try {
      await updateIntakeForm(parseInt(formId), {
        status: IntakeFormStatus.ARCHIVED,
      });
      setForm((prev) => ({ ...prev, status: IntakeFormStatus.ARCHIVED }));
      setSnackbar({
        open: true,
        message: "Form archived successfully",
        severity: "success",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to archive form",
        severity: "error",
      });
    }
  };

  const handleCopyBuilderLink = () => {
    const publicId = form.publicId;
    if (!publicId) {
      setSnackbar({
        open: true,
        message: "Publish the form first to generate a shareable link",
        severity: "error",
      });
      return;
    }
    const link = `${window.location.origin}/${publicId}/use-case-form-intake`;
    navigator.clipboard.writeText(link).catch(() => {});
    setSnackbar({
      open: true,
      message: "Form link copied to clipboard",
      severity: "info",
    });
  };

  const handlePreviewBuilder = () => {
    const publicId = form.publicId;
    if (publicId) window.open(`/${publicId}/use-case-form-intake`, "_blank");
  };

  // ============================================================================
  // Derived values
  // ============================================================================

  const selectedField = form.schema.fields.find(
    (f) => f.id === selectedFieldId
  );
  const fieldToDeleteLabel = fieldToDelete
    ? form.schema.fields.find((f) => f.id === fieldToDelete)?.label ||
      "this field"
    : "this field";

  const llmKeyItems = [
    { _id: "", name: "None" },
    ...llmKeys.map((key) => ({
      _id: String(key.id),
      name: `${key.name} — ${key.model}`,
    })),
  ];

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Stack className="vwhome" gap="16px">
      <PageBreadcrumbs
        items={[
          {
            label: "Intake forms",
            path: "/intake-forms",
            icon: <ClipboardList size={14} strokeWidth={1.5} />,
          },
          {
            label: isEditing
              ? form.name || "Edit form"
              : formId === "new"
                ? "New form"
                : "Builder",
            icon: <ClipboardList size={14} strokeWidth={1.5} />,
          },
        ]}
      />

      <Box sx={{ height: "calc(100vh - 100px)" }}>
        <Box
          sx={{
            height: "100%",
            backgroundColor: theme.palette.background.main,
            borderRadius: theme.shape.borderRadius,
            border: `1px solid ${theme.palette.border.dark}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {isLoadingForm ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
              }}
            >
              <CircularProgress sx={{ color: theme.palette.primary.main }} />
            </Box>
          ) : (
            <>
              {/* Builder header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1,
                  borderBottom: `1px solid ${theme.palette.border.dark}`,
                  backgroundColor: theme.palette.background.main,
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Chip label={`Status: ${form.status}`} uppercase={false} />
                    <Chip
                      label={form.entityType === IntakeEntityType.USE_CASE ? "Type: AI use case" : "Type: Model inventory"}
                      uppercase={false}
                      backgroundColor="#E3F2FD"
                      textColor="#1565C0"
                    />
                    {isDirty && (
                      <Typography
                        sx={{ color: theme.palette.text.accent, fontSize: "11px" }}
                      >
                        Unsaved
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Centered Edit / Design toggle */}
                <Box
                  sx={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    border: `1px solid ${theme.palette.border.dark}`,
                    borderRadius: "6px",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    onClick={() => setBuilderMode("edit")}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      px: "12px",
                      py: "5px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                      userSelect: "none",
                      backgroundColor: builderMode === "edit" ? theme.palette.primary.main : theme.palette.background.main,
                      color: builderMode === "edit" ? theme.palette.background.main : theme.palette.text.secondary,
                      transition: "all 0.15s ease",
                      "&:hover": {
                        backgroundColor: builderMode === "edit" ? "#0F5A47" : theme.palette.background.accent,
                      },
                    }}
                  >
                    <Pencil size={13} />
                    Edit
                  </Box>
                  <Box
                    onClick={() => setBuilderMode("design")}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      px: "12px",
                      py: "5px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                      userSelect: "none",
                      borderLeft: `1px solid ${theme.palette.border.dark}`,
                      backgroundColor: builderMode === "design" ? theme.palette.primary.main : theme.palette.background.main,
                      color: builderMode === "design" ? theme.palette.background.main : theme.palette.text.secondary,
                      transition: "all 0.15s ease",
                      "&:hover": {
                        backgroundColor: builderMode === "design" ? "#0F5A47" : theme.palette.background.accent,
                      },
                    }}
                  >
                    <PaintBucket size={13} />
                    Design
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexShrink: 0,
                  }}
                >
                  {form.status === IntakeFormStatus.ACTIVE && (
                    <>
                      <Tooltip title="Copy link">
                        <Box
                          onClick={handleCopyBuilderLink}
                          sx={{
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            p: 0.5,
                            borderRadius: "4px",
                            "&:hover": { backgroundColor: theme.palette.background.accent },
                          }}
                        >
                          <Copy size={15} color={theme.palette.text.tertiary} />
                        </Box>
                      </Tooltip>
                      <Tooltip title="Preview">
                        <Box
                          onClick={handlePreviewBuilder}
                          sx={{
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            p: 0.5,
                            borderRadius: "4px",
                            "&:hover": { backgroundColor: theme.palette.background.accent },
                          }}
                        >
                          <Eye size={15} color={theme.palette.text.tertiary} />
                        </Box>
                      </Tooltip>
                    </>
                  )}
                  {form.status === IntakeFormStatus.ACTIVE && (
                    <CustomizableButton
                      variant="outlined"
                      onClick={handleArchiveBuilder}
                      icon={<Archive size={14} />}
                      text="Archive"
                      sx={{
                        height: 34,
                        fontSize: "13px",
                        borderColor: theme.palette.border.dark,
                        color: theme.palette.text.secondary,
                        "&:hover": {
                          borderColor: theme.palette.text.accent,
                          backgroundColor: theme.palette.background.accent,
                        },
                      }}
                    />
                  )}
                  <CustomizableButton
                    variant="outlined"
                    onClick={handleSave}
                    isDisabled={isSaving || !isDirty || form.status === IntakeFormStatus.ARCHIVED}
                    loading={isSaving}
                    icon={<Save size={14} />}
                    text="Save"
                    sx={{
                      height: 34,
                      fontSize: "13px",
                      borderColor: theme.palette.border.dark,
                      color: theme.palette.text.secondary,
                      "&:hover": {
                        borderColor: theme.palette.text.accent,
                        backgroundColor: theme.palette.background.accent,
                      },
                    }}
                  />
                  {form.status !== IntakeFormStatus.ACTIVE && form.status !== IntakeFormStatus.ARCHIVED && (
                    <CustomizableButton
                      variant="contained"
                      onClick={handlePublish}
                      isDisabled={isSaving}
                      icon={<Send size={14} />}
                      text="Publish"
                      sx={{
                        height: 34,
                        fontSize: "13px",
                        backgroundColor: theme.palette.primary.main,
                        "&:hover": { backgroundColor: "#0F5A47" },
                      }}
                    />
                  )}
                </Box>
              </Box>

              {/* Builder content */}
              <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
                <FieldPalette
                  disabled={form.status === IntakeFormStatus.ARCHIVED}
                  fieldCount={form.schema.fields.length}
                  onAddField={addField}
                />
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                >
                  <FormCanvas
                    fields={form.schema.fields}
                    selectedFieldId={selectedFieldId}
                    onSelectField={setSelectedFieldId}
                    onDeleteField={requestDeleteField}
                    onDuplicateField={duplicateField}
                    onMoveUp={moveFieldUp}
                    onMoveDown={moveFieldDown}
                    formName={form.name}
                    formDescription={form.description}
                    onNameChange={(name) => updateForm({ name })}
                    onDescriptionChange={(description) => updateForm({ description })}
                    collectContactInfo={form.designSettings?.collectContactInfo ?? false}
                  />
                  <SuggestedQuestionsPanel
                    fieldCount={form.schema.fields.length}
                    onAdd={addField}
                  />
                </Box>
                {builderMode === "design" ? (
                  <DesignPanel
                    settings={form.designSettings ?? DEFAULT_DESIGN_SETTINGS}
                    onChange={(designSettings) => {
                      updateForm({ designSettings });
                    }}
                  />
                ) : selectedField ? (
                  <FieldEditor
                    field={selectedField}
                    entityType={form.entityType}
                    usedEntityMappings={form.schema.fields
                      .filter((f) => f.id !== selectedField.id && f.entityFieldMapping)
                      .map((f) => f.entityFieldMapping!)}
                    onChange={updateField}
                    onClose={() => setSelectedFieldId(null)}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 325,
                      borderLeft: `1px solid ${theme.palette.border.dark}`,
                      backgroundColor: theme.palette.background.main,
                      overflowY: "auto",
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      onClick={() => setFormSettingsOpen((prev) => !prev)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: "8px",
                        py: "8px",
                        cursor: "pointer",
                        borderBottom: `1px solid ${theme.palette.border.dark}`,
                        userSelect: "none",
                        "&:hover": { backgroundColor: theme.palette.background.accent },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Settings size={15} color={theme.palette.text.tertiary} />
                        <Typography
                          sx={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                          }}
                        >
                          Form settings
                        </Typography>
                      </Box>
                      {formSettingsOpen ? (
                        <ChevronDown size={15} color={theme.palette.text.tertiary} />
                      ) : (
                        <ChevronRight size={15} color={theme.palette.text.tertiary} />
                      )}
                    </Box>

                    <Collapse in={formSettingsOpen}>
                      <Box
                        sx={{
                          p: "8px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "20px",
                        }}
                      >
                        <Box>
                          <CustomizableMultiSelect
                            label="Recipients"
                            value={form.recipients || []}
                            onChange={(e) => {
                              const val = e.target.value;
                              const ids = (Array.isArray(val) ? val : [val]).map(Number);
                              setForm((prev) => ({ ...prev, recipients: ids }));
                              setIsDirty(true);
                            }}
                            items={orgUsers.map((u) => ({
                              _id: u.id,
                              name: [u.name, u.surname].filter(Boolean).join(" "),
                              email: u.email,
                            }))}
                            placeholder="Select recipients"
                            sx={{
                              fontSize: "12px",
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: "11px",
                              color: theme.palette.text.accent,
                              mt: "4px",
                            }}
                          >
                            Submission responses will be emailed to selected recipients
                          </Typography>
                        </Box>

                        <Box>
                          <Typography
                            sx={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: theme.palette.text.secondary,
                              mb: "4px",
                            }}
                          >
                            Risk tier system
                          </Typography>
                          <RadioGroup
                            value={form.riskTierSystem ?? "generic"}
                            onChange={(e) =>
                              updateForm({
                                riskTierSystem: e.target.value,
                              })
                            }
                            sx={{ pl: "16px", gap: "8px" }}
                          >
                            <FormControlLabel
                              value="generic"
                              sx={{ mr: 0 }}
                              control={
                                <Radio
                                  size="small"
                                  sx={{
                                    color: theme.palette.text.accent,
                                    "&.Mui-checked": {
                                      color: theme.palette.primary.main,
                                    },
                                    p: 0.5,
                                  }}
                                />
                              }
                              label={
                                <Typography
                                  sx={{
                                    fontSize: "12px",
                                    color: theme.palette.text.secondary,
                                  }}
                                >
                                  Generic (Low / Med / High / Critical)
                                </Typography>
                              }
                            />
                            <FormControlLabel
                              value="eu_ai_act"
                              sx={{ mr: 0 }}
                              control={
                                <Radio
                                  size="small"
                                  sx={{
                                    color: theme.palette.text.accent,
                                    "&.Mui-checked": {
                                      color: theme.palette.primary.main,
                                    },
                                    p: 0.5,
                                  }}
                                />
                              }
                              label={
                                <Typography
                                  sx={{
                                    fontSize: "12px",
                                    color: theme.palette.text.secondary,
                                  }}
                                >
                                  EU AI Act (Minimal / Limited / High /
                                  Unacceptable)
                                </Typography>
                              }
                            />
                          </RadioGroup>
                        </Box>

                        <Box>
                          <Typography
                            sx={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: theme.palette.text.secondary,
                              mb: "4px",
                            }}
                          >
                            LLM key
                          </Typography>
                          <Select
                            id="llm-key"
                            label=""
                            value={
                              form.llmKeyId ? String(form.llmKeyId) : ""
                            }
                            onChange={(e) =>
                              updateForm({
                                llmKeyId:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                              })
                            }
                            items={llmKeyItems}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                height: 34,
                                fontSize: "12px",
                              },
                            }}
                          />
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "4px",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            updateForm({
                              suggestedQuestionsEnabled:
                                !form.suggestedQuestionsEnabled,
                            })
                          }
                        >
                          <Checkbox
                            id="suggested-questions"
                            isChecked={
                              form.suggestedQuestionsEnabled ?? false
                            }
                            value="suggestedQuestionsEnabled"
                            onChange={() =>
                              updateForm({
                                suggestedQuestionsEnabled:
                                  !form.suggestedQuestionsEnabled,
                              })
                            }
                            size="small"
                            label=""
                            sx={{ p: 0, mt: "1px", flexShrink: 0 }}
                          />
                          <Box>
                            <Typography
                              sx={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: theme.palette.text.secondary,
                              }}
                            >
                              Suggested questions
                            </Typography>
                            <Typography
                              sx={{ fontSize: "11px", color: theme.palette.text.accent }}
                            >
                              Show AI-suggested questions to form submitters
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "4px",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            const ds = form.designSettings ?? { ...DEFAULT_DESIGN_SETTINGS };
                            updateForm({
                              designSettings: {
                                ...DEFAULT_DESIGN_SETTINGS,
                                ...ds,
                                collectContactInfo: !(ds.collectContactInfo ?? false),
                              },
                            });
                          }}
                        >
                          <Checkbox
                            id="collect-contact-info"
                            isChecked={form.designSettings?.collectContactInfo ?? false}
                            value="collectContactInfo"
                            onChange={() => {
                              const ds = form.designSettings ?? { ...DEFAULT_DESIGN_SETTINGS };
                              updateForm({
                                designSettings: {
                                  ...DEFAULT_DESIGN_SETTINGS,
                                  ...ds,
                                  collectContactInfo: !(ds.collectContactInfo ?? false),
                                },
                              });
                            }}
                            size="small"
                            label=""
                            sx={{ p: 0, mt: "1px", flexShrink: 0 }}
                          />
                          <Box>
                            <Typography
                              sx={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: theme.palette.text.secondary,
                              }}
                            >
                              Collect contact information
                            </Typography>
                            <Typography
                              sx={{ fontSize: "11px", color: theme.palette.text.accent }}
                            >
                              Show name and email fields on the public form
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Collapse>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* Delete field modal */}
      <StandardModal
        title="Delete field"
        description={`Are you sure you want to delete "${fieldToDeleteLabel}"? This action cannot be undone.`}
        isOpen={deleteFieldModalOpen}
        onClose={() => {
          setDeleteFieldModalOpen(false);
          setFieldToDelete(null);
        }}
        onSubmit={confirmDeleteField}
        submitButtonText="Delete"
        submitButtonColor="#c62828"
        maxWidth="440px"
        fitContent
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

export default IntakeFormBuilder;
