import { Box, Typography, TextField, Checkbox, FormControlLabel, Select, MenuItem } from "@mui/material";
import { CheckSquare } from "lucide-react";
import { FormField } from "./types";

/**
 * Props for QuestionPreview
 */
interface QuestionPreviewProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onSelectField: (id: string) => void;
  formName: string;
  formDescription: string;
}

/**
 * Renders a preview of how the field will look in the actual form
 */
function FieldPreview({ field, isSelected, onClick }: { field: FormField; isSelected: boolean; onClick: () => void }) {
  const renderField = () => {
    switch (field.type) {
      case "text":
        return (
          <TextField
            placeholder={field.placeholder || "Type your answer here..."}
            variant="outlined"
            fullWidth
            disabled
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: "14px",
                backgroundColor: "#fff",
                "& fieldset": { borderColor: "#d0d5dd" },
              },
              "& .MuiInputBase-input::placeholder": {
                color: "#9ca3af",
                opacity: 1,
              },
            }}
          />
        );

      case "textarea":
        return (
          <TextField
            placeholder={field.placeholder || "Type your answer here..."}
            variant="outlined"
            fullWidth
            multiline
            rows={3}
            disabled
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: "14px",
                backgroundColor: "#fff",
                "& fieldset": { borderColor: "#d0d5dd" },
              },
              "& .MuiInputBase-input::placeholder": {
                color: "#9ca3af",
                opacity: 1,
              },
            }}
          />
        );

      case "email":
        return (
          <TextField
            placeholder={field.placeholder || "name@example.com"}
            variant="outlined"
            fullWidth
            type="email"
            disabled
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: "14px",
                backgroundColor: "#fff",
                "& fieldset": { borderColor: "#d0d5dd" },
              },
              "& .MuiInputBase-input::placeholder": {
                color: "#9ca3af",
                opacity: 1,
              },
            }}
          />
        );

      case "url":
        return (
          <TextField
            placeholder={field.placeholder || "https://"}
            variant="outlined"
            fullWidth
            disabled
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: "14px",
                backgroundColor: "#fff",
                "& fieldset": { borderColor: "#d0d5dd" },
              },
              "& .MuiInputBase-input::placeholder": {
                color: "#9ca3af",
                opacity: 1,
              },
            }}
          />
        );

      case "number":
        return (
          <TextField
            placeholder={field.placeholder || "0"}
            variant="outlined"
            fullWidth
            type="number"
            disabled
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: "14px",
                backgroundColor: "#fff",
                "& fieldset": { borderColor: "#d0d5dd" },
              },
              "& .MuiInputBase-input::placeholder": {
                color: "#9ca3af",
                opacity: 1,
              },
            }}
          />
        );

      case "date":
        return (
          <TextField
            variant="outlined"
            fullWidth
            type="date"
            disabled
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: "14px",
                backgroundColor: "#fff",
                "& fieldset": { borderColor: "#d0d5dd" },
              },
            }}
          />
        );

      case "select":
        return (
          <Select
            displayEmpty
            fullWidth
            disabled
            size="small"
            sx={{
              fontSize: "14px",
              backgroundColor: "#fff",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d0d5dd" },
            }}
            renderValue={() => (
              <Typography sx={{ color: "#9ca3af", fontSize: "14px" }}>
                {field.placeholder || "Select an option..."}
              </Typography>
            )}
          >
            {field.options?.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        );

      case "multiselect":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {field.options?.length ? (
              field.options.map((option) => (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Checkbox
                      disabled
                      size="small"
                      sx={{
                        color: "#d1d5db",
                        "&.Mui-checked": { color: "#13715B" },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: "14px", color: "#4b5563" }}>
                      {option.label}
                    </Typography>
                  }
                />
              ))
            ) : (
              <Typography sx={{ color: "#9ca3af", fontSize: "13px" }}>
                Add options in the settings panel
              </Typography>
            )}
          </Box>
        );

      case "checkbox":
        return (
          <FormControlLabel
            control={
              <Checkbox
                disabled
                size="small"
                sx={{
                  color: "#d1d5db",
                  "&.Mui-checked": { color: "#13715B" },
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: "14px", color: "#4b5563" }}>
                {field.placeholder || "Yes, I agree"}
              </Typography>
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2.5,
        borderRadius: "4px",
        border: isSelected ? "2px solid #13715B" : "1px solid transparent",
        backgroundColor: isSelected ? "#f0fdf4" : "transparent",
        cursor: "pointer",
        transition: "all 0.15s ease",
        "&:hover": {
          backgroundColor: isSelected ? "#f0fdf4" : "#f9fafb",
          border: isSelected ? "2px solid #13715B" : "1px solid #e5e7eb",
        },
      }}
    >
      {/* Question label */}
      <Typography
        sx={{
          fontSize: "14px",
          fontWeight: 500,
          color: "#1f2937",
          mb: 1.5,
        }}
      >
        {field.label || "Untitled question"}
        {field.validation?.required && (
          <Typography
            component="span"
            sx={{ color: "#ef4444", ml: 0.5, fontSize: "14px" }}
          >
            *
          </Typography>
        )}
      </Typography>

      {/* Field input */}
      <Box sx={{ pointerEvents: "none" }}>{renderField()}</Box>

      {/* Help text */}
      {field.helpText && (
        <Typography
          sx={{
            fontSize: "12px",
            color: "#6b7280",
            mt: 1.5,
          }}
        >
          {field.helpText}
        </Typography>
      )}
    </Box>
  );
}

/**
 * No questions state
 */
function NoQuestionsState() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        textAlign: "center",
        p: 4,
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          backgroundColor: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 3,
        }}
      >
        <CheckSquare size={36} color="#9ca3af" />
      </Box>
      <Typography
        sx={{
          fontSize: "18px",
          fontWeight: 600,
          color: "#1f2937",
          mb: 1,
        }}
      >
        Start building your form
      </Typography>
      <Typography
        sx={{
          fontSize: "14px",
          color: "#6b7280",
          maxWidth: 300,
        }}
      >
        Click "Add question" in the sidebar to add your first question
      </Typography>
    </Box>
  );
}

/**
 * Form preview component - shows all fields in a scrollable form preview
 */
export function QuestionPreview({ fields, selectedFieldId, onSelectField, formName, formDescription }: QuestionPreviewProps) {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f9fafb",
        overflow: "hidden",
      }}
    >
      {/* Preview header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#fff",
        }}
      >
        <Typography
          sx={{
            fontSize: "11px",
            fontWeight: 600,
            color: "#9ca3af",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Form preview
        </Typography>
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#4b5563",
            mt: 0.5,
          }}
        >
          {formName || "Untitled form"}
        </Typography>
      </Box>

      {/* Preview content */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 3,
        }}
      >
        {fields.length === 0 ? (
          <NoQuestionsState />
        ) : (
          <Box
            sx={{
              maxWidth: 640,
              mx: "auto",
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            {/* Form header */}
            <Box
              sx={{
                p: 3,
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#fafafa",
              }}
            >
              <Typography
                sx={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#1f2937",
                  mb: formDescription ? 1 : 0,
                }}
              >
                {formName || "Untitled form"}
              </Typography>
              {formDescription && (
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#6b7280",
                  }}
                >
                  {formDescription}
                </Typography>
              )}
            </Box>

            {/* Form fields */}
            <Box sx={{ p: 2 }}>
              {fields.map((field) => (
                <FieldPreview
                  key={field.id}
                  field={field}
                  isSelected={selectedFieldId === field.id}
                  onClick={() => onSelectField(field.id)}
                />
              ))}
            </Box>

            {/* Submit button preview */}
            <Box
              sx={{
                p: 3,
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Box
                sx={{
                  px: 4,
                  py: 1.5,
                  backgroundColor: "#13715B",
                  color: "#fff",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Submit
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default QuestionPreview;
