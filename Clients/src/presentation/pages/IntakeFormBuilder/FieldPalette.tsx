import { Box, Typography, Paper, Stack } from "@mui/material";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import NotesIcon from "@mui/icons-material/Notes";
import EmailIcon from "@mui/icons-material/Email";
import LinkIcon from "@mui/icons-material/Link";
import NumbersIcon from "@mui/icons-material/Numbers";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ArrowDropDownCircleIcon from "@mui/icons-material/ArrowDropDownCircle";
import ChecklistIcon from "@mui/icons-material/Checklist";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { PALETTE_ITEMS, PaletteItem } from "./types";

/**
 * Icon mapping for field types
 */
const ICON_MAP: Record<string, React.ElementType> = {
  TextFields: TextFieldsIcon,
  Notes: NotesIcon,
  Email: EmailIcon,
  Link: LinkIcon,
  Numbers: NumbersIcon,
  CalendarMonth: CalendarMonthIcon,
  ArrowDropDownCircle: ArrowDropDownCircleIcon,
  Checklist: ChecklistIcon,
  CheckBox: CheckBoxIcon,
};

/**
 * Draggable palette item component
 */
interface DraggablePaletteItemProps {
  item: PaletteItem;
}

function DraggablePaletteItem({ item }: DraggablePaletteItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: {
      type: "palette",
      paletteItem: item,
    },
  });

  const IconComponent = ICON_MAP[item.icon] || TextFieldsIcon;

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      elevation={isDragging ? 4 : 1}
      sx={{
        p: 1.5,
        cursor: "grab",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        borderRadius: "4px",
        border: "1px solid #d0d5dd",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: "#13715B",
          boxShadow: "0 2px 8px rgba(19, 113, 91, 0.15)",
        },
        "&:active": {
          cursor: "grabbing",
        },
      }}
    >
      <DragIndicatorIcon sx={{ color: "#9ca3af", fontSize: 18 }} />
      <IconComponent sx={{ color: "#13715B", fontSize: 20 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: "#1f2937",
            fontSize: "13px",
            lineHeight: 1.3,
          }}
        >
          {item.label}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "#6b7280",
            fontSize: "11px",
            display: "block",
            lineHeight: 1.2,
          }}
        >
          {item.description}
        </Typography>
      </Box>
    </Paper>
  );
}

/**
 * Field palette component - displays available field types for drag-and-drop
 */
interface FieldPaletteProps {
  disabled?: boolean;
}

export function FieldPalette({ disabled = false }: FieldPaletteProps) {
  return (
    <Box
      sx={{
        width: 240,
        height: "100%",
        borderRight: "1px solid #d0d5dd",
        backgroundColor: "#f9fafb",
        display: "flex",
        flexDirection: "column",
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid #d0d5dd",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: "#1f2937",
            fontSize: "14px",
          }}
        >
          Field types
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "#6b7280",
            fontSize: "12px",
          }}
        >
          Drag fields to the canvas
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 1.5,
        }}
      >
        <Stack spacing={1}>
          {PALETTE_ITEMS.map((item) => (
            <DraggablePaletteItem key={item.type} item={item} />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

export default FieldPalette;
