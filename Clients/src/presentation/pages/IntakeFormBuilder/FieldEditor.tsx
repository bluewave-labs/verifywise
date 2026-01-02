import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
  Button,
  Stack,
  FormControl,
  InputLabel,
} from "@mui/material";
import { X, Plus, Trash2, GripVertical } from "lucide-react";
import {
  FormField,
  FieldOption,
  FieldType,
  ENTITY_FIELD_MAPPINGS,
  EntityFieldMapping,
} from "./types";
import { IntakeEntityType } from "../../../domain/intake/enums";

/**
 * Field type labels
 */
const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Short text",
  textarea: "Long text",
  email: "Email",
  url: "URL",
  number: "Number",
  date: "Date",
  select: "Dropdown",
  multiselect: "Multi-select",
  checkbox: "Checkbox",
};

/**
 * Options editor for select/multiselect fields
 */
interface OptionsEditorProps {
  options: FieldOption[];
  onChange: (options: FieldOption[]) => void;
}

function OptionsEditor({ options, onChange }: OptionsEditorProps) {
  const handleAddOption = () => {
    const newOption: FieldOption = {
      label: `Option ${options.length + 1}`,
      value: `option${options.length + 1}`,
    };
    onChange([...options, newOption]);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    onChange(newOptions);
  };

  const handleUpdateOption = (index: number, field: keyof FieldOption, value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onChange(newOptions);
  };

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 600, color: "#1f2937", fontSize: "13px", mb: 1 }}
      >
        Options
      </Typography>
      <Stack spacing={1}>
        {options.map((option, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 1,
              backgroundColor: "#f9fafb",
              borderRadius: "4px",
              border: "1px solid #e5e7eb",
            }}
          >
            <GripVertical size={16} color="#9ca3af" />
            <TextField
              size="small"
              placeholder="Label"
              value={option.label}
              onChange={(e) => handleUpdateOption(index, "label", e.target.value)}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  fontSize: "13px",
                  "& fieldset": { borderColor: "#d0d5dd" },
                },
              }}
            />
            <TextField
              size="small"
              placeholder="Value"
              value={option.value}
              onChange={(e) => handleUpdateOption(index, "value", e.target.value)}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  fontSize: "13px",
                  "& fieldset": { borderColor: "#d0d5dd" },
                },
              }}
            />
            <IconButton
              size="small"
              onClick={() => handleRemoveOption(index)}
              disabled={options.length <= 1}
              sx={{
                p: 0.5,
                color: "#6b7280",
                "&:hover": { color: "#ef4444" },
              }}
            >
              <Trash2 size={16} />
            </IconButton>
          </Box>
        ))}
      </Stack>
      <Button
        startIcon={<Plus size={14} />}
        onClick={handleAddOption}
        size="small"
        sx={{
          mt: 1,
          color: "#13715B",
          textTransform: "none",
          fontSize: "12px",
          "&:hover": { backgroundColor: "#f0fdf4" },
        }}
      >
        Add option
      </Button>
    </Box>
  );
}

/**
 * Field editor component - edits field properties
 */
interface FieldEditorProps {
  field: FormField;
  entityType: IntakeEntityType;
  onChange: (field: FormField) => void;
  onClose: () => void;
}

export function FieldEditor({ field, entityType, onChange, onClose }: FieldEditorProps) {
  const [localField, setLocalField] = useState<FormField>(field);

  useEffect(() => {
    setLocalField(field);
  }, [field]);

  const handleChange = <K extends keyof FormField>(key: K, value: FormField[K]) => {
    const updated = { ...localField, [key]: value };
    setLocalField(updated);
    onChange(updated);
  };

  const handleValidationChange = (key: string, value: boolean | number | string) => {
    const updated = {
      ...localField,
      validation: { ...localField.validation, [key]: value },
    };
    setLocalField(updated);
    onChange(updated);
  };

  const entityMappings = ENTITY_FIELD_MAPPINGS[entityType] || [];
  const compatibleMappings = entityMappings.filter((mapping: EntityFieldMapping) =>
    mapping.requiredFieldType.includes(localField.type)
  );

  const showOptions = localField.type === "select" || localField.type === "multiselect";
  const showMinMax = localField.type === "number";
  const showMinMaxLength = localField.type === "text" || localField.type === "textarea";

  return (
    <Box
      sx={{
        width: 320,
        height: "100%",
        borderLeft: "1px solid #d0d5dd",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: "1px solid #d0d5dd",
        }}
      >
        <Box>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: "#1f2937", fontSize: "14px" }}
          >
            Field settings
          </Typography>
          <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "12px" }}>
            {FIELD_TYPE_LABELS[localField.type]}
          </Typography>
        </Box>
        <Tooltip title="Close editor">
          <IconButton size="small" onClick={onClose} sx={{ p: 0.5 }}>
            <X size={18} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        <Stack spacing={2.5}>
          {/* Basic settings */}
          <Box>
            <Typography
              variant="overline"
              sx={{
                fontWeight: 600,
                color: "#6b7280",
                fontSize: "10px",
                letterSpacing: "0.5px",
                display: "block",
                mb: 1.5,
              }}
            >
              Basic settings
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Label"
                size="small"
                fullWidth
                value={localField.label}
                onChange={(e) => handleChange("label", e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: "13px",
                    "& fieldset": { borderColor: "#d0d5dd" },
                  },
                  "& .MuiInputLabel-root": { fontSize: "13px" },
                }}
              />
              <TextField
                label="Placeholder"
                size="small"
                fullWidth
                value={localField.placeholder || ""}
                onChange={(e) => handleChange("placeholder", e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: "13px",
                    "& fieldset": { borderColor: "#d0d5dd" },
                  },
                  "& .MuiInputLabel-root": { fontSize: "13px" },
                }}
              />
              <TextField
                label="Help text"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={localField.helpText || ""}
                onChange={(e) => handleChange("helpText", e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: "13px",
                    "& fieldset": { borderColor: "#d0d5dd" },
                  },
                  "& .MuiInputLabel-root": { fontSize: "13px" },
                }}
              />
            </Stack>
          </Box>

          <Divider />

          {/* Options for select/multiselect */}
          {showOptions && (
            <>
              <OptionsEditor
                options={localField.options || []}
                onChange={(options) => handleChange("options", options)}
              />
              <Divider />
            </>
          )}

          {/* Validation settings */}
          <Box>
            <Typography
              variant="overline"
              sx={{
                fontWeight: 600,
                color: "#6b7280",
                fontSize: "10px",
                letterSpacing: "0.5px",
                display: "block",
                mb: 1.5,
              }}
            >
              Validation
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localField.validation?.required || false}
                    onChange={(e) => handleValidationChange("required", e.target.checked)}
                    size="small"
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "#13715B",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: "#13715B",
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: "13px", color: "#1f2937" }}>
                    Required field
                  </Typography>
                }
              />

              {showMinMaxLength && (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    label="Min length"
                    type="number"
                    size="small"
                    value={localField.validation?.minLength || ""}
                    onChange={(e) =>
                      handleValidationChange("minLength", parseInt(e.target.value) || 0)
                    }
                    sx={{
                      flex: 1,
                      "& .MuiOutlinedInput-root": {
                        fontSize: "13px",
                        "& fieldset": { borderColor: "#d0d5dd" },
                      },
                      "& .MuiInputLabel-root": { fontSize: "13px" },
                    }}
                  />
                  <TextField
                    label="Max length"
                    type="number"
                    size="small"
                    value={localField.validation?.maxLength || ""}
                    onChange={(e) =>
                      handleValidationChange("maxLength", parseInt(e.target.value) || 0)
                    }
                    sx={{
                      flex: 1,
                      "& .MuiOutlinedInput-root": {
                        fontSize: "13px",
                        "& fieldset": { borderColor: "#d0d5dd" },
                      },
                      "& .MuiInputLabel-root": { fontSize: "13px" },
                    }}
                  />
                </Box>
              )}

              {showMinMax && (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    label="Min value"
                    type="number"
                    size="small"
                    value={localField.validation?.min || ""}
                    onChange={(e) =>
                      handleValidationChange("min", parseInt(e.target.value) || 0)
                    }
                    sx={{
                      flex: 1,
                      "& .MuiOutlinedInput-root": {
                        fontSize: "13px",
                        "& fieldset": { borderColor: "#d0d5dd" },
                      },
                      "& .MuiInputLabel-root": { fontSize: "13px" },
                    }}
                  />
                  <TextField
                    label="Max value"
                    type="number"
                    size="small"
                    value={localField.validation?.max || ""}
                    onChange={(e) =>
                      handleValidationChange("max", parseInt(e.target.value) || 0)
                    }
                    sx={{
                      flex: 1,
                      "& .MuiOutlinedInput-root": {
                        fontSize: "13px",
                        "& fieldset": { borderColor: "#d0d5dd" },
                      },
                      "& .MuiInputLabel-root": { fontSize: "13px" },
                    }}
                  />
                </Box>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Entity field mapping */}
          <Box>
            <Typography
              variant="overline"
              sx={{
                fontWeight: 600,
                color: "#6b7280",
                fontSize: "10px",
                letterSpacing: "0.5px",
                display: "block",
                mb: 1.5,
              }}
            >
              Entity mapping
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: "13px" }}>Map to entity field</InputLabel>
              <Select
                value={localField.entityFieldMapping || ""}
                onChange={(e) => handleChange("entityFieldMapping", e.target.value)}
                label="Map to entity field"
                sx={{
                  fontSize: "13px",
                  "& fieldset": { borderColor: "#d0d5dd" },
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {compatibleMappings.map((mapping: EntityFieldMapping) => (
                  <MenuItem key={mapping.field} value={mapping.field}>
                    <Box>
                      <Typography sx={{ fontSize: "13px" }}>{mapping.label}</Typography>
                      <Typography sx={{ fontSize: "11px", color: "#6b7280" }}>
                        {mapping.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {compatibleMappings.length === 0 && (
              <Typography
                variant="caption"
                sx={{ color: "#9ca3af", fontSize: "11px", mt: 0.5, display: "block" }}
              >
                No compatible entity fields for this field type
              </Typography>
            )}
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

export default FieldEditor;
