/**
 * LifecycleConfigEditor - Admin UI for managing lifecycle phases and items.
 * Supports add/remove/reorder phases and items with type-specific config.
 */

import { useState, useCallback } from "react";
import {
  Stack,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Box,
  CircularProgress,
  useTheme,
} from "@mui/material";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  X,
} from "lucide-react";
import {
  LifecyclePhase,
  LifecycleItem,
  LifecycleItemType,
} from "../../../../../domain/interfaces/i.modelLifecycle";
import { useLifecycleConfig } from "../../../../../application/hooks/useModelLifecycle";
import {
  createPhase,
  updatePhase,
  deletePhase,
  reorderPhases,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
} from "../../../../../application/repository/modelLifecycle.repository";

interface LifecycleConfigEditorProps {
  open: boolean;
  onClose: () => void;
}

const ITEM_TYPES: { value: LifecycleItemType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Text Area" },
  { value: "documents", label: "Documents" },
  { value: "people", label: "People" },
  { value: "classification", label: "Classification" },
  { value: "checklist", label: "Checklist" },
  { value: "approval", label: "Approval" },
];

const LifecycleConfigEditor = ({ open, onClose }: LifecycleConfigEditorProps) => {
  const theme = useTheme();
  const { phases, loading, refresh } = useLifecycleConfig(true);
  const [saving, setSaving] = useState(false);

  // New phase form
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newPhaseDesc, setNewPhaseDesc] = useState("");

  // New item form (per phase)
  const [addingItemForPhase, setAddingItemForPhase] = useState<number | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState<LifecycleItemType>("text");
  const [newItemRequired, setNewItemRequired] = useState(false);

  // Expanded phases
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());

  const toggleExpanded = (phaseId: number) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  };

  // ============================================================================
  // Phase operations
  // ============================================================================

  const handleCreatePhase = useCallback(async () => {
    if (!newPhaseName.trim()) return;
    setSaving(true);
    try {
      await createPhase({ name: newPhaseName.trim(), description: newPhaseDesc.trim() || undefined });
      setNewPhaseName("");
      setNewPhaseDesc("");
      refresh();
    } catch (err) {
      console.error("Failed to create phase:", err);
    } finally {
      setSaving(false);
    }
  }, [newPhaseName, newPhaseDesc, refresh]);

  const handleDeletePhase = useCallback(
    async (phaseId: number) => {
      if (!window.confirm("Delete this phase and all its items? This cannot be undone.")) return;
      setSaving(true);
      try {
        await deletePhase(phaseId);
        refresh();
      } catch (err) {
        console.error("Failed to delete phase:", err);
      } finally {
        setSaving(false);
      }
    },
    [refresh]
  );

  const handleMovePhase = useCallback(
    async (phaseId: number, direction: "up" | "down") => {
      const idx = phases.findIndex((p) => p.id === phaseId);
      if (idx < 0) return;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= phases.length) return;

      const ordered = [...phases];
      [ordered[idx], ordered[newIdx]] = [ordered[newIdx], ordered[idx]];
      const orderedIds = ordered.map((p) => p.id);

      setSaving(true);
      try {
        await reorderPhases(orderedIds);
        refresh();
      } catch (err) {
        console.error("Failed to reorder phases:", err);
      } finally {
        setSaving(false);
      }
    },
    [phases, refresh]
  );

  const handleTogglePhaseActive = useCallback(
    async (phaseId: number, isActive: boolean) => {
      setSaving(true);
      try {
        await updatePhase(phaseId, { is_active: isActive });
        refresh();
      } catch (err) {
        console.error("Failed to toggle phase:", err);
      } finally {
        setSaving(false);
      }
    },
    [refresh]
  );

  // ============================================================================
  // Item operations
  // ============================================================================

  const handleCreateItem = useCallback(
    async (phaseId: number) => {
      if (!newItemName.trim()) return;
      setSaving(true);
      try {
        await createItem(phaseId, {
          name: newItemName.trim(),
          item_type: newItemType,
          is_required: newItemRequired,
        });
        setNewItemName("");
        setNewItemType("text");
        setNewItemRequired(false);
        setAddingItemForPhase(null);
        refresh();
      } catch (err) {
        console.error("Failed to create item:", err);
      } finally {
        setSaving(false);
      }
    },
    [newItemName, newItemType, newItemRequired, refresh]
  );

  const handleDeleteItem = useCallback(
    async (itemId: number) => {
      if (!window.confirm("Delete this item? This cannot be undone.")) return;
      setSaving(true);
      try {
        await deleteItem(itemId);
        refresh();
      } catch (err) {
        console.error("Failed to delete item:", err);
      } finally {
        setSaving(false);
      }
    },
    [refresh]
  );

  const handleToggleItemRequired = useCallback(
    async (itemId: number, isRequired: boolean) => {
      setSaving(true);
      try {
        await updateItem(itemId, { is_required: isRequired });
        refresh();
      } catch (err) {
        console.error("Failed to toggle item required:", err);
      } finally {
        setSaving(false);
      }
    },
    [refresh]
  );

  const handleMoveItem = useCallback(
    async (phaseId: number, items: LifecycleItem[], itemId: number, direction: "up" | "down") => {
      const idx = items.findIndex((i) => i.id === itemId);
      if (idx < 0) return;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= items.length) return;

      const ordered = [...items];
      [ordered[idx], ordered[newIdx]] = [ordered[newIdx], ordered[idx]];
      const orderedIds = ordered.map((i) => i.id);

      setSaving(true);
      try {
        await reorderItems(phaseId, orderedIds);
        refresh();
      } catch (err) {
        console.error("Failed to reorder items:", err);
      } finally {
        setSaving(false);
      }
    },
    [refresh]
  );

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: "85vh" },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Configure Model Lifecycle
        </Typography>
        <IconButton onClick={onClose} size="small">
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Stack spacing={2}>
            {/* Existing phases */}
            {phases.map((phase, phaseIdx) => (
              <Box
                key={phase.id}
                sx={{
                  border: `1px solid ${theme.palette.border.light}`,
                  borderRadius: 2,
                  overflow: "hidden",
                  opacity: phase.is_active ? 1 : 0.6,
                }}
              >
                {/* Phase header */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    px: 2,
                    py: 1,
                    backgroundColor: theme.palette.background.accent,
                    cursor: "pointer",
                  }}
                  onClick={() => toggleExpanded(phase.id)}
                >
                  <GripVertical size={14} color={theme.palette.text.tertiary} />
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>
                    {phase.name}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={phase.is_active}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleTogglePhaseActive(phase.id, e.target.checked);
                        }}
                      />
                    }
                    label={<Typography variant="caption">Active</Typography>}
                    onClick={(e) => e.stopPropagation()}
                    sx={{ mr: 0 }}
                  />
                  <IconButton
                    size="small"
                    disabled={phaseIdx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMovePhase(phase.id, "up");
                    }}
                  >
                    <ChevronUp size={14} />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={phaseIdx === phases.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMovePhase(phase.id, "down");
                    }}
                  >
                    <ChevronDown size={14} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhase(phase.id);
                    }}
                    sx={{ color: theme.palette.status.error.text }}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </Stack>

                {/* Phase items (expanded) */}
                {expandedPhases.has(phase.id) && (
                  <Stack spacing={0} sx={{ px: 2, py: 1 }}>
                    {(phase.items ?? []).map((item, itemIdx) => (
                      <Stack
                        key={item.id}
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{
                          py: 0.75,
                          borderBottom: `1px solid ${theme.palette.border.light}`,
                        }}
                      >
                        <Typography variant="body2" sx={{ flex: 1, fontSize: "13px" }}>
                          {item.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            backgroundColor: theme.palette.background.fill,
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            fontSize: "11px",
                          }}
                        >
                          {item.item_type}
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={item.is_required}
                              onChange={(e) =>
                                handleToggleItemRequired(item.id, e.target.checked)
                              }
                            />
                          }
                          label={<Typography variant="caption">Req</Typography>}
                          sx={{ mr: 0 }}
                        />
                        <IconButton
                          size="small"
                          disabled={itemIdx === 0}
                          onClick={() =>
                            handleMoveItem(phase.id, phase.items ?? [], item.id, "up")
                          }
                        >
                          <ChevronUp size={12} />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={itemIdx === (phase.items?.length ?? 0) - 1}
                          onClick={() =>
                            handleMoveItem(phase.id, phase.items ?? [], item.id, "down")
                          }
                        >
                          <ChevronDown size={12} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteItem(item.id)}
                          sx={{ color: theme.palette.status.error.text }}
                        >
                          <Trash2 size={12} />
                        </IconButton>
                      </Stack>
                    ))}

                    {/* Add item form */}
                    {addingItemForPhase === phase.id ? (
                      <Stack direction="row" spacing={1} sx={{ pt: 1 }} alignItems="center">
                        <TextField
                          size="small"
                          placeholder="Item name"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          sx={{ flex: 1 }}
                        />
                        <Select
                          size="small"
                          value={newItemType}
                          onChange={(e) => setNewItemType(e.target.value as LifecycleItemType)}
                          sx={{ minWidth: 120 }}
                        >
                          {ITEM_TYPES.map((t) => (
                            <MenuItem key={t.value} value={t.value}>
                              {t.label}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={newItemRequired}
                              onChange={(e) => setNewItemRequired(e.target.checked)}
                            />
                          }
                          label={<Typography variant="caption">Req</Typography>}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleCreateItem(phase.id)}
                          disabled={!newItemName.trim() || saving}
                        >
                          Add
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setAddingItemForPhase(null);
                            setNewItemName("");
                          }}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    ) : (
                      <Button
                        size="small"
                        startIcon={<Plus size={14} />}
                        onClick={() => setAddingItemForPhase(phase.id)}
                        sx={{ alignSelf: "flex-start", mt: 1, textTransform: "none" }}
                      >
                        Add item
                      </Button>
                    )}
                  </Stack>
                )}
              </Box>
            ))}

            {/* Add new phase */}
            <Box
              sx={{
                border: `1px dashed ${theme.palette.border.dark}`,
                borderRadius: 2,
                p: 2,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Add new phase
              </Typography>
              <Stack spacing={1}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Phase name"
                  value={newPhaseName}
                  onChange={(e) => setNewPhaseName(e.target.value)}
                />
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="Description (optional)"
                  value={newPhaseDesc}
                  onChange={(e) => setNewPhaseDesc(e.target.value)}
                />
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Plus size={14} />}
                  onClick={handleCreatePhase}
                  disabled={!newPhaseName.trim() || saving}
                  sx={{ alignSelf: "flex-start", textTransform: "none" }}
                >
                  Create phase
                </Button>
              </Stack>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LifecycleConfigEditor;
