import { Box, Typography, Paper } from "@mui/material";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import AddIcon from "@mui/icons-material/Add";
import { FormField } from "./types";
import { FieldCard } from "./FieldCard";

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: 300,
        p: 4,
        textAlign: "center",
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
          mb: 2,
        }}
      >
        <AddIcon sx={{ fontSize: 40, color: "#9ca3af" }} />
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: "#1f2937",
          mb: 1,
          fontSize: "16px",
        }}
      >
        Start building your form
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "#6b7280",
          maxWidth: 300,
          fontSize: "13px",
        }}
      >
        Drag and drop fields from the palette on the left to create your intake form
      </Typography>
    </Box>
  );
}

/**
 * Drop indicator component
 */
function DropIndicator() {
  return (
    <Box
      sx={{
        height: 4,
        backgroundColor: "#13715B",
        borderRadius: 2,
        my: 1,
        animation: "pulse 1.5s ease-in-out infinite",
        "@keyframes pulse": {
          "0%, 100%": { opacity: 0.5 },
          "50%": { opacity: 1 },
        },
      }}
    />
  );
}

/**
 * Form canvas component - displays and manages form fields
 */
interface FormCanvasProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onSelectField: (fieldId: string | null) => void;
  onDeleteField: (fieldId: string) => void;
  onDuplicateField: (field: FormField) => void;
  formName: string;
  formDescription: string;
}

export function FormCanvas({
  fields,
  selectedFieldId,
  onSelectField,
  onDeleteField,
  onDuplicateField,
  formName,
  formDescription,
}: FormCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-drop-zone",
  });

  const handleCanvasClick = () => {
    onSelectField(null);
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f3f4f6",
        overflow: "hidden",
      }}
    >
      {/* Canvas header */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid #d0d5dd",
          backgroundColor: "#fff",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "#6b7280",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            display: "block",
            mb: 0.5,
          }}
        >
          Form preview
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: "#1f2937",
            fontSize: "16px",
          }}
        >
          {formName || "Untitled form"}
        </Typography>
        {formDescription && (
          <Typography
            variant="body2"
            sx={{
              color: "#6b7280",
              fontSize: "13px",
              mt: 0.5,
            }}
          >
            {formDescription}
          </Typography>
        )}
      </Box>

      {/* Canvas content */}
      <Box
        ref={setNodeRef}
        onClick={handleCanvasClick}
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            maxWidth: 700,
            mx: "auto",
            minHeight: fields.length === 0 ? 400 : "auto",
            backgroundColor: "#fff",
            border: isOver ? "2px dashed #13715B" : "1px solid #d0d5dd",
            borderRadius: "8px",
            transition: "all 0.2s ease",
          }}
        >
          {fields.length === 0 ? (
            <EmptyState />
          ) : (
            <Box sx={{ p: 2 }}>
              {isOver && fields.length > 0 && <DropIndicator />}
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {fields.map((field) => (
                    <FieldCard
                      key={field.id}
                      field={field}
                      isSelected={selectedFieldId === field.id}
                      onSelect={onSelectField}
                      onDelete={onDeleteField}
                      onDuplicate={onDuplicateField}
                    />
                  ))}
                </Box>
              </SortableContext>
              {isOver && <DropIndicator />}
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default FormCanvas;
