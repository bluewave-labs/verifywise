import { Box, Typography, IconButton, Tooltip, Chip } from "@mui/material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import NotesIcon from "@mui/icons-material/Notes";
import EmailIcon from "@mui/icons-material/Email";
import LinkIcon from "@mui/icons-material/Link";
import NumbersIcon from "@mui/icons-material/Numbers";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ArrowDropDownCircleIcon from "@mui/icons-material/ArrowDropDownCircle";
import ChecklistIcon from "@mui/icons-material/Checklist";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { FormField, FieldType } from "./types";

/**
 * Icon mapping for field types
 */
const ICON_MAP: Record<FieldType, React.ElementType> = {
  text: TextFieldsIcon,
  textarea: NotesIcon,
  email: EmailIcon,
  url: LinkIcon,
  number: NumbersIcon,
  date: CalendarMonthIcon,
  select: ArrowDropDownCircleIcon,
  multiselect: ChecklistIcon,
  checkbox: CheckBoxIcon,
};

/**
 * Label mapping for field types
 */
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

/**
 * Field card component - displays a field in the canvas
 */
interface FieldCardProps {
  field: FormField;
  isSelected: boolean;
  onSelect: (fieldId: string) => void;
  onDelete: (fieldId: string) => void;
  onDuplicate: (field: FormField) => void;
}

export function FieldCard({
  field,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: FieldCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    data: {
      type: "canvas",
      field,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const IconComponent = ICON_MAP[field.type] || TextFieldsIcon;

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

  return (
    <Box
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      sx={{
        display: "flex",
        alignItems: "stretch",
        backgroundColor: isSelected ? "#f0fdf4" : "#fff",
        border: isSelected ? "2px solid #13715B" : "1px solid #d0d5dd",
        borderRadius: "4px",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: "#13715B",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          "& .field-actions": {
            opacity: 1,
          },
        },
      }}
    >
      {/* Drag handle */}
      <Box
        {...attributes}
        {...listeners}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 1,
          backgroundColor: isSelected ? "#dcfce7" : "#f9fafb",
          borderRight: "1px solid #d0d5dd",
          cursor: "grab",
          "&:active": {
            cursor: "grabbing",
          },
        }}
      >
        <DragIndicatorIcon sx={{ color: "#9ca3af", fontSize: 20 }} />
      </Box>

      {/* Field content */}
      <Box sx={{ flex: 1, p: 2, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <IconComponent sx={{ color: "#13715B", fontSize: 20, mt: 0.25 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: "#1f2937",
                  fontSize: "14px",
                }}
              >
                {field.label}
              </Typography>
              {field.validation?.required && (
                <Typography
                  component="span"
                  sx={{ color: "#ef4444", fontSize: "14px" }}
                >
                  *
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={TYPE_LABELS[field.type]}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "11px",
                  backgroundColor: "#f3f4f6",
                  color: "#6b7280",
                  "& .MuiChip-label": {
                    px: 1,
                  },
                }}
              />
              {field.entityFieldMapping && (
                <Chip
                  label={`Maps to: ${field.entityFieldMapping}`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "11px",
                    backgroundColor: "#dbeafe",
                    color: "#1d4ed8",
                    "& .MuiChip-label": {
                      px: 1,
                    },
                  }}
                />
              )}
            </Box>
            {field.helpText && (
              <Typography
                variant="caption"
                sx={{
                  color: "#9ca3af",
                  fontSize: "12px",
                  display: "block",
                  mt: 0.5,
                }}
              >
                {field.helpText}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Actions */}
      <Box
        className="field-actions"
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 0.5,
          px: 1,
          opacity: isSelected ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      >
        <Tooltip title="Duplicate field" placement="left">
          <IconButton
            size="small"
            onClick={handleDuplicate}
            sx={{
              p: 0.5,
              color: "#6b7280",
              "&:hover": {
                color: "#13715B",
                backgroundColor: "#f0fdf4",
              },
            }}
          >
            <ContentCopyIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete field" placement="left">
          <IconButton
            size="small"
            onClick={handleDelete}
            sx={{
              p: 0.5,
              color: "#6b7280",
              "&:hover": {
                color: "#ef4444",
                backgroundColor: "#fef2f2",
              },
            }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default FieldCard;
