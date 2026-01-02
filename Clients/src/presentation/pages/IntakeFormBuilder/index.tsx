import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import PublishIcon from "@mui/icons-material/Publish";
import ArchiveIcon from "@mui/icons-material/Archive";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { FieldPalette } from "./FieldPalette";
import { FormCanvas } from "./FormCanvas";
import { FieldEditor } from "./FieldEditor";
import { FieldCard } from "./FieldCard";
import {
  FormField,
  IntakeForm,
  PaletteItem,
  createFieldFromPalette,
  createEmptyForm,
  generateFieldId,
  generateSlug,
} from "./types";
import { IntakeFormStatus, IntakeEntityType } from "../../../domain/intake/enums";
import {
  getIntakeForm,
  createIntakeForm,
  updateIntakeForm,
} from "../../../application/repository/intakeForm.repository";

/**
 * Intake form builder page component
 */
export function IntakeFormBuilder() {
  const { formId } = useParams<{ formId?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(formId);

  // State
  const [form, setForm] = useState<IntakeForm>(createEmptyForm());
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<FormField | PaletteItem | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "info" });

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load form if editing
  useEffect(() => {
    if (formId) {
      loadForm(parseInt(formId));
    }
  }, [formId]);

  const loadForm = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await getIntakeForm(id);
      if (response.data) {
        setForm(response.data);
      }
    } catch (error) {
      console.error("Failed to load form:", error);
      setSnackbar({
        open: true,
        message: "Failed to load form",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Form field operations
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
      schema: {
        ...prev.schema,
        fields: [...prev.schema.fields, field],
      },
    }));
    setIsDirty(true);
    setSelectedFieldId(field.id);
  }, []);

  const deleteField = useCallback((fieldId: string) => {
    setForm((prev) => ({
      ...prev,
      schema: {
        ...prev.schema,
        fields: prev.schema.fields.filter((f) => f.id !== fieldId),
      },
    }));
    setIsDirty(true);
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  }, [selectedFieldId]);

  const duplicateField = useCallback((field: FormField) => {
    const newField: FormField = {
      ...field,
      id: generateFieldId(),
      label: `${field.label} (copy)`,
      order: form.schema.fields.length,
    };
    addField(newField);
  }, [form.schema.fields.length, addField]);

  const reorderFields = useCallback((oldIndex: number, newIndex: number) => {
    setForm((prev) => ({
      ...prev,
      schema: {
        ...prev.schema,
        fields: arrayMove(prev.schema.fields, oldIndex, newIndex).map((f, i) => ({
          ...f,
          order: i,
        })),
      },
    }));
    setIsDirty(true);
  }, []);

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as { type: string; field?: FormField; paletteItem?: PaletteItem };

    if (data.type === "palette" && data.paletteItem) {
      setActiveDragItem(data.paletteItem);
    } else if (data.type === "canvas" && data.field) {
      setActiveDragItem(data.field);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const activeData = active.data.current as { type: string; field?: FormField; paletteItem?: PaletteItem };

    // Adding new field from palette
    if (activeData.type === "palette" && activeData.paletteItem) {
      const newField = createFieldFromPalette(
        activeData.paletteItem,
        form.schema.fields.length
      );
      addField(newField);
      return;
    }

    // Reordering existing fields
    if (activeData.type === "canvas" && activeData.field) {
      const oldIndex = form.schema.fields.findIndex((f) => f.id === active.id);
      const overData = over.data.current as { type: string; field?: FormField } | undefined;

      let newIndex: number;
      if (overData?.type === "canvas" && overData.field) {
        newIndex = form.schema.fields.findIndex((f) => f.id === over.id);
      } else {
        // Dropped on canvas drop zone
        newIndex = form.schema.fields.length - 1;
      }

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        reorderFields(oldIndex, newIndex);
      }
    }
  };

  // Save form
  const handleSave = async () => {
    if (!form.name.trim()) {
      setSnackbar({
        open: true,
        message: "Form name is required",
        severity: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      const formData = {
        ...form,
        slug: form.slug || generateSlug(form.name),
      };

      if (isEditing && formId) {
        await updateIntakeForm(parseInt(formId), formData);
        setSnackbar({
          open: true,
          message: "Form saved successfully",
          severity: "success",
        });
      } else {
        const response = await createIntakeForm(formData);
        if (response.data?.id) {
          navigate(`/intake-forms/${response.data.id}/edit`, { replace: true });
          setSnackbar({
            open: true,
            message: "Form created successfully",
            severity: "success",
          });
        }
      }
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to save form:", error);
      setSnackbar({
        open: true,
        message: "Failed to save form",
        severity: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Publish form
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
      await handleSave();
      if (formId) {
        await updateIntakeForm(parseInt(formId), { status: IntakeFormStatus.ACTIVE });
        setForm((prev) => ({ ...prev, status: IntakeFormStatus.ACTIVE }));
        setSnackbar({
          open: true,
          message: "Form published successfully",
          severity: "success",
        });
      }
    } catch (error) {
      console.error("Failed to publish form:", error);
      setSnackbar({
        open: true,
        message: "Failed to publish form",
        severity: "error",
      });
    }
  };

  // Archive form
  const handleArchive = async () => {
    if (!formId) return;

    try {
      await updateIntakeForm(parseInt(formId), { status: IntakeFormStatus.ARCHIVED });
      setForm((prev) => ({ ...prev, status: IntakeFormStatus.ARCHIVED }));
      setSnackbar({
        open: true,
        message: "Form archived successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Failed to archive form:", error);
      setSnackbar({
        open: true,
        message: "Failed to archive form",
        severity: "error",
      });
    }
  };

  // Copy form link
  const handleCopyLink = () => {
    const link = `${window.location.origin}/intake/${form.slug}`;
    navigator.clipboard.writeText(link);
    setSnackbar({
      open: true,
      message: "Form link copied to clipboard",
      severity: "info",
    });
  };

  const selectedField = form.schema.fields.find((f) => f.id === selectedFieldId);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <CircularProgress sx={{ color: "#13715B" }} />
      </Box>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            borderBottom: "1px solid #d0d5dd",
            backgroundColor: "#fff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton onClick={() => navigate("/intake-forms")} sx={{ p: 0.5 }}>
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                  placeholder="Form name"
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  variant="standard"
                  sx={{
                    "& .MuiInput-root": {
                      fontSize: "18px",
                      fontWeight: 600,
                      "&:before": { borderBottom: "none" },
                      "&:hover:before": { borderBottom: "1px solid #d0d5dd !important" },
                    },
                  }}
                />
                <Chip
                  label={form.status}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: "11px",
                    textTransform: "capitalize",
                    backgroundColor:
                      form.status === IntakeFormStatus.ACTIVE
                        ? "#dcfce7"
                        : form.status === IntakeFormStatus.ARCHIVED
                        ? "#f3f4f6"
                        : "#fef3c7",
                    color:
                      form.status === IntakeFormStatus.ACTIVE
                        ? "#16a34a"
                        : form.status === IntakeFormStatus.ARCHIVED
                        ? "#6b7280"
                        : "#d97706",
                  }}
                />
                {isDirty && (
                  <Typography
                    variant="caption"
                    sx={{ color: "#9ca3af", fontSize: "11px" }}
                  >
                    Unsaved changes
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 0.5 }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel sx={{ fontSize: "12px" }}>Entity type</InputLabel>
                  <Select
                    value={form.entityType}
                    onChange={(e) =>
                      updateForm({ entityType: e.target.value as IntakeEntityType })
                    }
                    label="Entity type"
                    sx={{
                      fontSize: "12px",
                      height: 28,
                      "& fieldset": { borderColor: "#d0d5dd" },
                    }}
                  >
                    <MenuItem value={IntakeEntityType.MODEL}>Model inventory</MenuItem>
                    <MenuItem value={IntakeEntityType.USE_CASE}>Use case</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  placeholder="Form description"
                  value={form.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  size="small"
                  sx={{
                    width: 300,
                    "& .MuiOutlinedInput-root": {
                      fontSize: "12px",
                      height: 28,
                      "& fieldset": { borderColor: "#d0d5dd" },
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {form.status === IntakeFormStatus.ACTIVE && (
              <>
                <Tooltip title="Copy form link">
                  <IconButton onClick={handleCopyLink} size="small">
                    <ContentCopyIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Preview form">
                  <IconButton
                    onClick={() => window.open(`/intake/${form.slug}`, "_blank")}
                    size="small"
                  >
                    <VisibilityIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </>
            )}
            {form.status === IntakeFormStatus.ACTIVE && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<ArchiveIcon sx={{ fontSize: 16 }} />}
                onClick={handleArchive}
                sx={{
                  height: 34,
                  borderColor: "#d0d5dd",
                  color: "#6b7280",
                  textTransform: "none",
                  fontSize: "13px",
                  "&:hover": {
                    borderColor: "#9ca3af",
                    backgroundColor: "#f9fafb",
                  },
                }}
              >
                Archive
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={isSaving ? <CircularProgress size={14} /> : <SaveIcon sx={{ fontSize: 16 }} />}
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              sx={{
                height: 34,
                borderColor: "#d0d5dd",
                color: "#1f2937",
                textTransform: "none",
                fontSize: "13px",
                "&:hover": {
                  borderColor: "#13715B",
                  backgroundColor: "#f0fdf4",
                },
              }}
            >
              Save
            </Button>
            {form.status !== IntakeFormStatus.ACTIVE && (
              <Button
                variant="contained"
                size="small"
                startIcon={<PublishIcon sx={{ fontSize: 16 }} />}
                onClick={handlePublish}
                disabled={isSaving}
                sx={{
                  height: 34,
                  backgroundColor: "#13715B",
                  textTransform: "none",
                  fontSize: "13px",
                  "&:hover": {
                    backgroundColor: "#0f5c49",
                  },
                }}
              >
                Publish
              </Button>
            )}
          </Box>
        </Box>

        {/* Main content */}
        <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <FieldPalette disabled={form.status === IntakeFormStatus.ARCHIVED} />
          <FormCanvas
            fields={form.schema.fields}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            onDeleteField={deleteField}
            onDuplicateField={duplicateField}
            formName={form.name}
            formDescription={form.description}
          />
          {selectedField && (
            <FieldEditor
              field={selectedField}
              entityType={form.entityType}
              onChange={updateField}
              onClose={() => setSelectedFieldId(null)}
            />
          )}
        </Box>

        {/* Drag overlay */}
        <DragOverlay>
          {activeDragItem && "type" in activeDragItem && (
            <Box
              sx={{
                p: 2,
                backgroundColor: "#fff",
                border: "2px solid #13715B",
                borderRadius: "4px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                opacity: 0.9,
              }}
            >
              <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                {activeDragItem.label}
              </Typography>
            </Box>
          )}
          {activeDragItem && "id" in activeDragItem && (
            <FieldCard
              field={activeDragItem}
              isSelected={false}
              onSelect={() => {}}
              onDelete={() => {}}
              onDuplicate={() => {}}
            />
          )}
        </DragOverlay>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </DndContext>
  );
}

export default IntakeFormBuilder;
