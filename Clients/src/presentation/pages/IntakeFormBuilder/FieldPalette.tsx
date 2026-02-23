import { Box, Typography, Collapse, useTheme } from "@mui/material";
import {
  Type,
  FileText,
  Mail,
  Link,
  Hash,
  Calendar,
  ChevronDown,
  ListChecks,
  CheckSquare,
  Plus,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import {
  PALETTE_ITEMS,
  PaletteItem,
  HARDCODED_SUGGESTED_QUESTIONS,
  SuggestedQuestion,
  FormField,
  generateFieldId,
  createFieldFromPalette,
} from "./types";

const ICON_MAP: Record<string, React.ElementType> = {
  TextFields: Type,
  Notes: FileText,
  Email: Mail,
  Link: Link,
  Numbers: Hash,
  CalendarMonth: Calendar,
  ArrowDropDownCircle: ChevronDown,
  Checklist: ListChecks,
  CheckBox: CheckSquare,
};

interface ClickablePaletteItemProps {
  item: PaletteItem;
  onAdd: (item: PaletteItem) => void;
}

function ClickablePaletteItem({ item, onAdd }: ClickablePaletteItemProps) {
  const theme = useTheme();
  const IconComponent = ICON_MAP[item.icon] || Type;

  return (
    <Box
      onClick={() => onAdd(item)}
      sx={{
        p: "8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        borderRadius: "4px",
        border: `1px solid ${theme.palette.border.light}`,
        backgroundColor: theme.palette.background.main,
        transition: "all 0.15s ease",
        "&:hover": {
          borderColor: `${theme.palette.primary.main}80`,
          backgroundColor: theme.palette.background.fill,
          "& .palette-icon svg": {
            color: `${theme.palette.primary.main} !important`,
            stroke: `${theme.palette.primary.main} !important`,
            animation: "icon-shake 400ms ease-in-out",
          },
        },
      }}
    >
      <Box className="palette-icon" sx={{ display: "flex", flexShrink: 0 }}>
        <IconComponent size={16} strokeWidth={1.5} color={theme.palette.text.tertiary} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 500, color: theme.palette.text.primary, fontSize: "13px", lineHeight: 1.3 }}>
          {item.label}
        </Typography>
        <Typography sx={{ color: theme.palette.other.icon, fontSize: "11px", lineHeight: 1.2 }}>
          {item.description}
        </Typography>
      </Box>
      <Plus size={14} color={theme.palette.text.accent} style={{ flexShrink: 0 }} />
    </Box>
  );
}

function groupByCategory(questions: SuggestedQuestion[]): Record<string, SuggestedQuestion[]> {
  return questions.reduce<Record<string, SuggestedQuestion[]>>((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {});
}

interface SuggestedCategoryProps {
  category: string;
  questions: SuggestedQuestion[];
  fieldCount: number;
  onAdd: (field: FormField) => void;
}

function SuggestedCategory({ category, questions, fieldCount, onAdd }: SuggestedCategoryProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleAdd = (question: SuggestedQuestion) => {
    const field: FormField = {
      id: generateFieldId(),
      type: question.fieldType,
      label: question.label,
      guidanceText: question.guidanceText,
      options: question.options,
      order: fieldCount,
    };
    onAdd(field);
  };

  return (
    <Box>
      <Box
        onClick={() => setOpen((prev) => !prev)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          px: "4px",
          py: "6px",
          cursor: "pointer",
          borderRadius: "4px",
          "&:hover": { backgroundColor: theme.palette.background.accent },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            transition: "transform 0.15s ease",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            color: theme.palette.other.icon,
          }}
        >
          <ChevronRight size={14} />
        </Box>
        <Typography sx={{ fontWeight: 600, color: theme.palette.text.secondary, fontSize: "12px", flex: 1 }}>
          {category}
        </Typography>
        <Typography sx={{ color: theme.palette.text.accent, fontSize: "11px" }}>
          {questions.length}
        </Typography>
      </Box>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ pl: 1, display: "flex", flexDirection: "column" }}>
          {questions.map((question, index) => (
            <Box
              key={index}
              onClick={() => handleAdd(question)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                py: "4px",
                px: "4px",
                borderRadius: "4px",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: theme.palette.background.accent,
                  "& .add-icon": { opacity: 1 },
                },
              }}
            >
              <Typography
                sx={{ flex: 1, color: theme.palette.text.tertiary, fontSize: "11.5px", lineHeight: 1.4 }}
              >
                {question.label}
              </Typography>
              <Box
                className="add-icon"
                sx={{
                  opacity: 0,
                  transition: "opacity 0.15s ease",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  color: theme.palette.primary.main,
                }}
              >
                <Plus size={14} />
              </Box>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

export interface SuggestedQuestionsPanelProps {
  fieldCount: number;
  onAdd: (field: FormField) => void;
}

export function SuggestedQuestionsPanel({ fieldCount, onAdd }: SuggestedQuestionsPanelProps) {
  const theme = useTheme();
  const grouped = groupByCategory(HARDCODED_SUGGESTED_QUESTIONS);
  const categories = Object.keys(grouped);

  return (
    <Box
      sx={{
        borderTop: `1px solid ${theme.palette.border.dark}`,
        backgroundColor: theme.palette.background.accent,
        flexShrink: 0,
      }}
    >
      <Box sx={{ px: "16px", py: "12px" }}>
        <Typography sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: "13px", mb: "8px" }}>
          Suggested questions
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {categories.map((category) => (
            <SuggestedCategory
              key={category}
              category={category}
              questions={grouped[category]}
              fieldCount={fieldCount}
              onAdd={onAdd}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

interface FieldPaletteProps {
  disabled?: boolean;
  fieldCount?: number;
  onAddField: (field: FormField) => void;
}

export function FieldPalette({
  disabled = false,
  fieldCount = 0,
  onAddField,
}: FieldPaletteProps) {
  const theme = useTheme();
  const handleAddPaletteItem = (item: PaletteItem) => {
    const field = createFieldFromPalette(item, fieldCount);
    onAddField(field);
  };

  return (
    <Box
      sx={{
        width: 240,
        height: "100%",
        borderRight: `1px solid ${theme.palette.border.dark}`,
        backgroundColor: theme.palette.background.accent,
        display: "flex",
        flexDirection: "column",
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.border.dark}` }}>
        <Typography sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: "14px" }}>
          Field types
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <Box sx={{ p: "8px" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {PALETTE_ITEMS.map((item) => (
              <ClickablePaletteItem key={item.type} item={item} onAdd={handleAddPaletteItem} />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default FieldPalette;
