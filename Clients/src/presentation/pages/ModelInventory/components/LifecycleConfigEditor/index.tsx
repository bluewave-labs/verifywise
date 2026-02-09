/**
 * LifecycleConfigEditor - Admin UI for managing lifecycle phases and items.
 * Supports add/remove/reorder phases and items with type-specific config.
 */

import { useState, useCallback } from "react";
import {
  Stack,
  Typography,
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
  ArrowUp,
  ArrowDown,
  ChevronRight,
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
import { getInputStyles } from "../../../../utils/inputStyles";
import Chip from "../../../../components/Chip";
import { CustomizableButton } from "../../../../components/button/customizable-button";

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
  const { phases, loading, refresh, setPhases } = useLifecycleConfig(true);
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
      // Optimistic update — change local state immediately so the phase
      // stays visible (just dimmed) instead of vanishing during a reload.
      setPhases((prev) =>
        prev.map((p) => (p.id === phaseId ? { ...p, is_active: isActive } : p))
      );
      try {
        await updatePhase(phaseId, { is_active: isActive });
      } catch (err) {
        console.error("Failed to toggle phase:", err);
        // Revert on failure
        setPhases((prev) =>
          prev.map((p) => (p.id === phaseId ? { ...p, is_active: !isActive } : p))
        );
      }
    },
    [setPhases]
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
      // Optimistic update
      setPhases((prev) =>
        prev.map((p) => ({
          ...p,
          items: p.items?.map((i) =>
            i.id === itemId ? { ...i, is_required: isRequired } : i
          ),
        }))
      );
      try {
        await updateItem(itemId, { is_required: isRequired });
      } catch (err) {
        console.error("Failed to toggle item required:", err);
        // Revert on failure
        setPhases((prev) =>
          prev.map((p) => ({
            ...p,
            items: p.items?.map((i) =>
              i.id === itemId ? { ...i, is_required: !isRequired } : i
            ),
          }))
        );
      }
    },
    [setPhases]
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
        sx: { maxHeight: "85vh", background: "#FCFCFD" },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography sx={{ fontWeight: 600, fontSize: "16px", color: "#1c2130" }}>
          Configure Model Lifecycle
        </Typography>
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading && phases.length === 0 ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Stack sx={{ gap: "12px" }}>
            {/* Existing phases */}
            {phases.map((phase, phaseIdx) => (
              <Box
                key={phase.id}
                sx={{
                  border: "1px solid #eaecf0",
                  borderRadius: "4px",
                  overflow: "hidden",
                  opacity: phase.is_active ? 1 : 0.6,
                }}
              >
                {/* Phase header */}
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{
                    gap: "8px",
                    px: "16px",
                    py: "10px",
                    backgroundColor: theme.palette.background.accent,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onClick={() => toggleExpanded(phase.id)}
                >
                  <ChevronRight
                    size={16}
                    color={theme.palette.text.secondary}
                    style={{
                      transform: expandedPhases.has(phase.id) ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 600, fontSize: "13px" }}>
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
                    aria-label="Move phase up"
                    sx={{ opacity: phaseIdx === 0 ? 0.4 : 1 }}
                  >
                    <ArrowUp size={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={phaseIdx === phases.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMovePhase(phase.id, "down");
                    }}
                    aria-label="Move phase down"
                    sx={{ opacity: phaseIdx === phases.length - 1 ? 0.4 : 1 }}
                  >
                    <ArrowDown size={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhase(phase.id);
                    }}
                    sx={{ color: theme.palette.status.error.text }}
                    aria-label="Delete phase"
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Stack>

                {/* Phase items (expanded) */}
                {expandedPhases.has(phase.id) && (
                  <Stack spacing={0} sx={{ px: "16px", py: "12px" }}>
                    {(phase.items ?? []).map((item, itemIdx) => (
                      <Stack
                        key={item.id}
                        direction="row"
                        alignItems="center"
                        sx={{
                          gap: "8px",
                          py: "8px",
                          borderBottom: `1px solid ${theme.palette.border.light}`,
                        }}
                      >
                        <Typography variant="body2" sx={{ flex: 1, fontSize: "13px" }}>
                          {item.name}
                        </Typography>
                        <Chip label={item.item_type} size="small" variant="info" />
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
                          aria-label="Move item up"
                          sx={{ opacity: itemIdx === 0 ? 0.4 : 1 }}
                        >
                          <ArrowUp size={16} />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={itemIdx === (phase.items?.length ?? 0) - 1}
                          onClick={() =>
                            handleMoveItem(phase.id, phase.items ?? [], item.id, "down")
                          }
                          aria-label="Move item down"
                          sx={{ opacity: itemIdx === (phase.items?.length ?? 0) - 1 ? 0.4 : 1 }}
                        >
                          <ArrowDown size={16} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteItem(item.id)}
                          sx={{ color: theme.palette.status.error.text }}
                          aria-label="Delete item"
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Stack>
                    ))}

                    {/* Add item form */}
                    {addingItemForPhase === phase.id ? (
                      <Stack direction="row" sx={{ gap: "8px", pt: "12px" }} alignItems="center">
                        <Stack sx={{ ...getInputStyles(theme), flex: 1 }}>
                          <TextField
                            size="small"
                            placeholder="Item name"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            fullWidth
                            sx={{
                              "& .MuiInputBase-root": {
                                height: "34px",
                                fontSize: "13px",
                              },
                            }}
                          />
                        </Stack>
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
                        <CustomizableButton
                          variant="contained"
                          size="small"
                          onClick={() => handleCreateItem(phase.id)}
                          isDisabled={!newItemName.trim() || saving}
                        >
                          Add
                        </CustomizableButton>
                        <CustomizableButton
                          variant="text"
                          size="small"
                          onClick={() => {
                            setAddingItemForPhase(null);
                            setNewItemName("");
                          }}
                        >
                          Cancel
                        </CustomizableButton>
                      </Stack>
                    ) : (
                      <CustomizableButton
                        variant="text"
                        size="small"
                        startIcon={<Plus size={16} />}
                        onClick={() => setAddingItemForPhase(phase.id)}
                        ariaLabel="Add item"
                        sx={{ alignSelf: "flex-start", mt: "12px", textTransform: "none" }}
                      >
                        Add item
                      </CustomizableButton>
                    )}
                  </Stack>
                )}
              </Box>
            ))}

            {/* Add new phase */}
            <Box
              sx={{
                border: `1px dashed ${theme.palette.border.dark}`,
                borderRadius: "4px",
                p: "16px",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: "8px" }}>
                Add new phase
              </Typography>
              <Stack sx={{ gap: "8px" }}>
                <Stack sx={getInputStyles(theme)}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Phase name"
                    value={newPhaseName}
                    onChange={(e) => setNewPhaseName(e.target.value)}
                    sx={{
                      "& .MuiInputBase-root": {
                        height: "34px",
                        fontSize: "13px",
                      },
                    }}
                  />
                </Stack>
                <Stack sx={getInputStyles(theme)}>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="Description (optional)"
                    value={newPhaseDesc}
                    onChange={(e) => setNewPhaseDesc(e.target.value)}
                    sx={{
                      "& .MuiInputBase-root": {
                        fontSize: "13px",
                      },
                    }}
                  />
                </Stack>
                <CustomizableButton
                  variant="contained"
                  size="small"
                  startIcon={<Plus size={16} />}
                  onClick={handleCreatePhase}
                  isDisabled={!newPhaseName.trim() || saving}
                  sx={{ alignSelf: "flex-start", textTransform: "none" }}
                >
                  Create phase
                </CustomizableButton>
              </Stack>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <CustomizableButton variant="text" onClick={onClose}>
          Close
        </CustomizableButton>
      </DialogActions>
    </Dialog>
  );
};

export default LifecycleConfigEditor;
