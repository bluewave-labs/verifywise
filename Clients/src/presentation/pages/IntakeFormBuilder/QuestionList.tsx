import { Box, Typography, TextField, Button, IconButton, Tooltip } from "@mui/material";
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Type,
  FileText,
  Mail,
  Link,
  Hash,
  Calendar,
  ChevronDown as DropdownIcon,
  ListChecks,
  CheckSquare,
} from "lucide-react";
import { FormField, FieldType, IntakeForm } from "./types";

/**
 * Icon mapping for field types
 */
const ICON_MAP: Record<FieldType, React.ElementType> = {
  text: Type,
  textarea: FileText,
  email: Mail,
  url: Link,
  number: Hash,
  date: Calendar,
  select: DropdownIcon,
  multiselect: ListChecks,
  checkbox: CheckSquare,
};

/**
 * Props for QuestionList
 */
interface QuestionListProps {
  form: IntakeForm;
  fields: FormField[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onAddClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDeleteField: (id: string) => void;
  onUpdateForm: (updates: Partial<IntakeForm>) => void;
  disabled?: boolean;
}

/**
 * Question list component - displays form questions with reorder controls
 */
export function QuestionList({
  form,
  fields,
  selectedFieldId,
  onSelectField,
  onAddClick,
  onMoveUp,
  onMoveDown,
  onDeleteField,
  onUpdateForm,
  disabled = false,
}: QuestionListProps) {
  return (
    <Box
      sx={{
        width: 280,
        height: "100%",
        borderRight: "1px solid #d0d5dd",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      {/* Form header - name and description */}
      <Box
        sx={{
          p: 3,
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <TextField
          placeholder="Form name"
          value={form.name}
          onChange={(e) => onUpdateForm({ name: e.target.value })}
          variant="standard"
          fullWidth
          sx={{
            mb: 2,
            "& .MuiInput-root": {
              fontSize: "16px",
              fontWeight: 600,
              color: "#1f2937",
              "&:before": { borderBottom: "1px solid transparent" },
              "&:hover:before": { borderBottom: "1px solid #d0d5dd !important" },
              "&.Mui-focused:after": { borderColor: "#13715B" },
            },
          }}
        />
        <TextField
          placeholder="Add a description..."
          value={form.description}
          onChange={(e) => onUpdateForm({ description: e.target.value })}
          variant="standard"
          fullWidth
          multiline
          maxRows={3}
          sx={{
            "& .MuiInput-root": {
              fontSize: "13px",
              color: "#6b7280",
              "&:before": { borderBottom: "1px solid transparent" },
              "&:hover:before": { borderBottom: "1px solid #d0d5dd !important" },
              "&.Mui-focused:after": { borderColor: "#13715B" },
            },
          }}
        />
      </Box>

      {/* Add question button */}
      <Box sx={{ p: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<Plus size={18} />}
          onClick={onAddClick}
          sx={{
            height: 40,
            borderColor: "#13715B",
            color: "#13715B",
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 500,
            borderRadius: "4px",
            "&:hover": {
              borderColor: "#0f5c49",
              backgroundColor: "#f0fdf4",
            },
          }}
        >
          Add question
        </Button>
      </Box>

      {/* Questions list */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
          pb: 2,
        }}
      >
        {fields.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              color: "#9ca3af",
            }}
          >
            <Typography sx={{ fontSize: "13px" }}>
              No questions yet
            </Typography>
            <Typography sx={{ fontSize: "12px", mt: 0.5 }}>
              Click "Add question" to get started
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {fields.map((field, index) => {
              const IconComponent = ICON_MAP[field.type] || Type;
              const isSelected = selectedFieldId === field.id;
              const isFirst = index === 0;
              const isLast = index === fields.length - 1;

              return (
                <Box
                  key={field.id}
                  onClick={() => onSelectField(field.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: "10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#f0fdf4" : "transparent",
                    border: isSelected ? "1px solid #13715B" : "1px solid #e5e7eb",
                    "&:hover": {
                      backgroundColor: isSelected ? "#f0fdf4" : "#f9fafb",
                      "& .question-actions": {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  {/* Question number */}
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "6px",
                      backgroundColor: isSelected ? "#13715B" : "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: isSelected ? "#fff" : "#6b7280",
                      }}
                    >
                      {index + 1}
                    </Typography>
                  </Box>

                  {/* Question icon and label */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconComponent
                        size={14}
                        color={isSelected ? "#13715B" : "#9ca3af"}
                      />
                      <Typography
                        sx={{
                          fontSize: "13px",
                          fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? "#1f2937" : "#4b5563",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {field.label || "Untitled question"}
                      </Typography>
                      {field.validation?.required && (
                        <Typography
                          component="span"
                          sx={{ color: "#ef4444", fontSize: "13px" }}
                        >
                          *
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Actions (visible on hover or when selected) */}
                  <Box
                    className="question-actions"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.25,
                      opacity: isSelected ? 1 : 0,
                      transition: "opacity 0.15s ease",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip title="Move up" placement="top">
                      <span>
                        <IconButton
                          size="small"
                          disabled={isFirst}
                          onClick={() => onMoveUp(index)}
                          sx={{
                            p: 0.5,
                            color: "#6b7280",
                            "&:hover": { color: "#1f2937", backgroundColor: "#e5e7eb" },
                            "&:disabled": { color: "#d1d5db" },
                          }}
                        >
                          <ChevronUp size={16} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move down" placement="top">
                      <span>
                        <IconButton
                          size="small"
                          disabled={isLast}
                          onClick={() => onMoveDown(index)}
                          sx={{
                            p: 0.5,
                            color: "#6b7280",
                            "&:hover": { color: "#1f2937", backgroundColor: "#e5e7eb" },
                            "&:disabled": { color: "#d1d5db" },
                          }}
                        >
                          <ChevronDown size={16} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Delete" placement="top">
                      <IconButton
                        size="small"
                        onClick={() => onDeleteField(field.id)}
                        sx={{
                          p: 0.5,
                          color: "#6b7280",
                          "&:hover": { color: "#ef4444", backgroundColor: "#fef2f2" },
                        }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default QuestionList;
