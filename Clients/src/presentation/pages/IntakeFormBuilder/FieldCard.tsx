import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Select as MuiSelect,
  MenuItem,
  FormControl,
  FormControlLabel,
  Checkbox as MuiCheckbox,
  OutlinedInput,
  FormHelperText,
  useTheme,
} from "@mui/material";
import {
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Info,
} from "lucide-react";
import Field from "../../components/Inputs/Field";
import { FormField, FieldType } from "./types";

const TYPE_LABELS: Record<FieldType, string> = {
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

interface FieldCardProps {
  field: FormField;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: (fieldId: string) => void;
  onDelete: (fieldId: string) => void;
  onDuplicate: (field: FormField) => void;
  onMoveUp: (fieldId: string) => void;
  onMoveDown: (fieldId: string) => void;
}

/**
 * Renders a field label with optional required asterisk and guidance tooltip
 */
function PreviewFieldLabel({
  label,
  guidanceText,
  required,
}: {
  label: string;
  guidanceText?: string;
  required?: boolean;
}) {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "4px", mb: "4px" }}>
      <Typography sx={{ fontSize: "13px", color: theme.palette.text.secondary, fontWeight: 500 }}>
        {label}
        {required && <span style={{ color: theme.palette.status.error.text }}> *</span>}
      </Typography>
      {guidanceText && (
        <Tooltip title={guidanceText} placement="top" arrow>
          <span style={{ display: "inline-flex", alignItems: "center", cursor: "help" }}>
            <Info size={14} strokeWidth={1.5} color={theme.palette.text.accent} />
          </span>
        </Tooltip>
      )}
    </Box>
  );
}

/**
 * Renders a static (non-functional) preview of a form field matching how it looks
 * in the actual public form.
 */
function FieldPreview({ field }: { field: FormField }) {
  const theme = useTheme();
  const isRequired = field.validation?.required;

  switch (field.type) {
    case "text":
    case "email":
    case "url":
      return (
        <>
          <PreviewFieldLabel label={field.label} guidanceText={field.guidanceText} required={isRequired} />
          <Field
            id={`preview-${field.id}`}
            label=""
            value=""
            placeholder={field.placeholder}
            type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
            disabled
          />
          {field.helpText && (
            <Typography sx={{ color: theme.palette.other.icon, fontSize: "11px", mt: "2px" }}>
              {field.helpText}
            </Typography>
          )}
        </>
      );

    case "textarea":
      return (
        <>
          <PreviewFieldLabel label={field.label} guidanceText={field.guidanceText} required={isRequired} />
          <Field
            id={`preview-${field.id}`}
            label=""
            value=""
            placeholder={field.placeholder}
            type="description"
            rows={3}
            disabled
          />
          {field.helpText && (
            <Typography sx={{ color: theme.palette.other.icon, fontSize: "11px", mt: "2px" }}>
              {field.helpText}
            </Typography>
          )}
        </>
      );

    case "number":
      return (
        <>
          <PreviewFieldLabel label={field.label} guidanceText={field.guidanceText} required={isRequired} />
          <Field
            id={`preview-${field.id}`}
            label=""
            value=""
            placeholder={field.placeholder || "0"}
            type="number"
            disabled
          />
          {field.helpText && (
            <Typography sx={{ color: theme.palette.other.icon, fontSize: "11px", mt: "2px" }}>
              {field.helpText}
            </Typography>
          )}
        </>
      );

    case "date":
      return (
        <>
          <PreviewFieldLabel label={field.label} guidanceText={field.guidanceText} required={isRequired} />
          <Field
            id={`preview-${field.id}`}
            label=""
            value=""
            type="date"
            disabled
          />
          {field.helpText && (
            <Typography sx={{ color: theme.palette.other.icon, fontSize: "11px", mt: "2px" }}>
              {field.helpText}
            </Typography>
          )}
        </>
      );

    case "select":
      return (
        <>
          <PreviewFieldLabel label={field.label} guidanceText={field.guidanceText} required={isRequired} />
          <FormControl fullWidth disabled>
            <MuiSelect
              value=""
              displayEmpty
              sx={{
                fontSize: "13px",
                borderRadius: "4px",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.border.dark },
              }}
            >
              <MenuItem value="" disabled>
                <em style={{ color: theme.palette.text.accent }}>Select an option</em>
              </MenuItem>
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </MuiSelect>
            {field.helpText && (
              <FormHelperText>{field.helpText}</FormHelperText>
            )}
          </FormControl>
        </>
      );

    case "multiselect":
      return (
        <>
          <PreviewFieldLabel label={field.label} guidanceText={field.guidanceText} required={isRequired} />
          <FormControl fullWidth disabled>
            <MuiSelect
              multiple
              value={[]}
              input={<OutlinedInput />}
              displayEmpty
              renderValue={() => (
                <em style={{ color: theme.palette.text.accent }}>Select options</em>
              )}
              sx={{
                fontSize: "13px",
                borderRadius: "4px",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.border.dark },
              }}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </MuiSelect>
            {field.helpText && (
              <FormHelperText>{field.helpText}</FormHelperText>
            )}
          </FormControl>
        </>
      );

    case "checkbox":
      return (
        <Box>
          <FormControlLabel
            disabled
            control={
              <MuiCheckbox
                checked={false}
                sx={{
                  color: theme.palette.border.dark,
                  "&.Mui-checked": { color: theme.palette.primary.main },
                }}
              />
            }
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Typography sx={{ fontSize: "13px", color: theme.palette.text.secondary }}>
                  {field.label}
                  {isRequired && <span style={{ color: theme.palette.status.error.text }}> *</span>}
                </Typography>
                {field.guidanceText && (
                  <Tooltip title={field.guidanceText} placement="top" arrow>
                    <span style={{ display: "inline-flex", alignItems: "center", cursor: "help" }}>
                      <Info size={14} strokeWidth={1.5} color={theme.palette.text.accent} />
                    </span>
                  </Tooltip>
                )}
              </Box>
            }
          />
          {field.helpText && (
            <FormHelperText sx={{ ml: 4 }}>{field.helpText}</FormHelperText>
          )}
        </Box>
      );

    default:
      return null;
  }
}

export function FieldCard({
  field,
  isSelected,
  isFirst,
  isLast,
  onSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: FieldCardProps) {
  const theme = useTheme();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(field.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(field.id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(field);
  };

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveUp(field.id);
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveDown(field.id);
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        position: "relative",
        backgroundColor: theme.palette.background.main,
        border: isSelected ? `1px solid ${theme.palette.border.dark}` : "1px solid transparent",
        borderRadius: "4px",
        cursor: "pointer",
        transition: "border-color 0.15s ease",
        p: "15px",
        "&:hover": {
          borderColor: theme.palette.border.dark,
          "& .field-actions": { opacity: 1 },
        },
      }}
    >
      {/* WYSIWYG field preview */}
      <Box sx={{ pointerEvents: "none" }}>
        <FieldPreview field={field} />
      </Box>

      {/* Metadata badges — shown only when selected */}
      {isSelected && (
        <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mt: "8px", flexWrap: "wrap" }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              height: 20,
              px: "6px",
              borderRadius: "4px",
              backgroundColor: theme.palette.background.accent,
              fontSize: "11px",
              color: theme.palette.other.icon,
            }}
          >
            {TYPE_LABELS[field.type]}
          </Box>
          {field.entityFieldMapping && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                height: 20,
                px: "6px",
                borderRadius: "4px",
                backgroundColor: "#dbeafe",
                fontSize: "11px",
                color: "#1d4ed8",
              }}
            >
              Maps to: {field.entityFieldMapping}
            </Box>
          )}
        </Box>
      )}

      {/* Action toolbar — appears on hover/selection */}
      <Box
        className="field-actions"
        sx={{
          position: "absolute",
          top: 4,
          right: 4,
          display: "flex",
          alignItems: "center",
          gap: "2px",
          backgroundColor: theme.palette.background.main,
          border: `1px solid ${theme.palette.border.dark}`,
          borderRadius: "4px",
          px: "2px",
          py: "1px",
          opacity: isSelected ? 1 : 0,
          transition: "opacity 0.15s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <Tooltip title="Move up" placement="top">
          <span>
            <IconButton
              size="small"
              disabled={isFirst}
              onClick={handleMoveUp}
              sx={{
                p: "3px",
                color: isFirst ? theme.palette.border.dark : theme.palette.other.icon,
                "&:hover": { color: theme.palette.primary.main, backgroundColor: theme.palette.background.fill },
              }}
            >
              <ChevronUp size={14} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Move down" placement="top">
          <span>
            <IconButton
              size="small"
              disabled={isLast}
              onClick={handleMoveDown}
              sx={{
                p: "3px",
                color: isLast ? theme.palette.border.dark : theme.palette.other.icon,
                "&:hover": { color: theme.palette.primary.main, backgroundColor: theme.palette.background.fill },
              }}
            >
              <ChevronDown size={14} />
            </IconButton>
          </span>
        </Tooltip>
        <Box sx={{ width: "1px", height: 16, backgroundColor: theme.palette.border.dark, mx: "1px" }} />
        <Tooltip title="Duplicate" placement="top">
          <IconButton
            size="small"
            onClick={handleDuplicate}
            sx={{
              p: "3px",
              color: theme.palette.other.icon,
              "&:hover": { color: theme.palette.primary.main, backgroundColor: theme.palette.background.fill },
            }}
          >
            <Copy size={14} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete" placement="top">
          <IconButton
            size="small"
            onClick={handleDelete}
            sx={{
              p: "3px",
              color: theme.palette.other.icon,
              "&:hover": { color: theme.palette.status.error.text, backgroundColor: theme.palette.status.error.bg },
            }}
          >
            <Trash2 size={14} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default FieldCard;
