/**
 * LifecycleItemField - Renders the correct field UI based on item_type.
 */

import { useState, useCallback, useRef } from "react";
import {
  Stack,
  TextField,
  Typography,
  Box,
  Chip,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  Select,
  MenuItem,
  IconButton,
  Button,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { Trash2, Upload, FileText, Check, X } from "lucide-react";
import {
  LifecycleItem,
  LifecycleValue,
  ChecklistValue,
  ApprovalValue,
  PeopleValue,
  ClassificationValue,
  ClassificationItemConfig,
  ChecklistItemConfig,
  PeopleItemConfig,
  TextItemConfig,
  TextareaItemConfig,
} from "../../../../../domain/interfaces/i.modelLifecycle";
import {
  upsertItemValue,
  addFileToItem,
  removeFileFromItem,
} from "../../../../../application/repository/modelLifecycle.repository";
import useUsers from "../../../../../application/hooks/useUsers";

interface LifecycleItemFieldProps {
  modelId: number;
  item: LifecycleItem;
  onValueChanged?: () => void;
}

const LifecycleItemField = ({
  modelId,
  item,
  onValueChanged,
}: LifecycleItemFieldProps) => {
  const theme = useTheme();
  const value = item.value;

  switch (item.item_type) {
    case "text":
      return (
        <TextFieldRenderer
          modelId={modelId}
          item={item}
          value={value}
          multiline={false}
          onValueChanged={onValueChanged}
        />
      );
    case "textarea":
      return (
        <TextFieldRenderer
          modelId={modelId}
          item={item}
          value={value}
          multiline
          onValueChanged={onValueChanged}
        />
      );
    case "documents":
      return (
        <DocumentsFieldRenderer
          modelId={modelId}
          item={item}
          value={value}
          onValueChanged={onValueChanged}
        />
      );
    case "people":
      return (
        <PeopleFieldRenderer
          modelId={modelId}
          item={item}
          value={value}
          onValueChanged={onValueChanged}
        />
      );
    case "classification":
      return (
        <ClassificationFieldRenderer
          modelId={modelId}
          item={item}
          value={value}
          onValueChanged={onValueChanged}
        />
      );
    case "checklist":
      return (
        <ChecklistFieldRenderer
          modelId={modelId}
          item={item}
          value={value}
          onValueChanged={onValueChanged}
        />
      );
    case "approval":
      return (
        <ApprovalFieldRenderer
          modelId={modelId}
          item={item}
          value={value}
          onValueChanged={onValueChanged}
        />
      );
    default:
      return (
        <Typography color="text.secondary" variant="body2">
          Unsupported field type: {item.item_type}
        </Typography>
      );
  }
};

// ============================================================================
// Text / Textarea renderer
// ============================================================================

interface TextFieldRendererProps {
  modelId: number;
  item: LifecycleItem;
  value: LifecycleValue | null | undefined;
  multiline: boolean;
  onValueChanged?: () => void;
}

const TextFieldRenderer = ({
  modelId,
  item,
  value,
  multiline,
  onValueChanged,
}: TextFieldRendererProps) => {
  const config = item.config as TextItemConfig | TextareaItemConfig;
  const [text, setText] = useState(value?.value_text ?? "");
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(value?.value_text ?? "");

  const handleBlur = useCallback(async () => {
    if (text === savedRef.current) return;
    setSaving(true);
    try {
      await upsertItemValue(modelId, item.id, { value_text: text || null });
      savedRef.current = text;
      onValueChanged?.();
    } catch {
      // keep current text, user can retry
    } finally {
      setSaving(false);
    }
  }, [text, modelId, item.id, onValueChanged]);

  return (
    <TextField
      fullWidth
      size="small"
      multiline={multiline}
      minRows={multiline ? 3 : undefined}
      maxRows={multiline ? 8 : undefined}
      placeholder={config?.placeholder || `Enter ${item.name.toLowerCase()}`}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={handleBlur}
      inputProps={{ maxLength: config?.maxLength }}
      InputProps={{
        endAdornment: saving ? (
          <CircularProgress size={16} />
        ) : undefined,
      }}
    />
  );
};

// ============================================================================
// Documents renderer
// ============================================================================

interface DocumentsFieldRendererProps {
  modelId: number;
  item: LifecycleItem;
  value: LifecycleValue | null | undefined;
  onValueChanged?: () => void;
}

const DocumentsFieldRenderer = ({
  modelId,
  item,
  value,
  onValueChanged,
}: DocumentsFieldRendererProps) => {
  const theme = useTheme();
  const files = value?.files ?? [];
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles || selectedFiles.length === 0) return;

      // For now, we expect files to be already uploaded to the file system.
      // This component links existing files. Real file upload would go through
      // the file manager first, then link via addFileToItem.
      // Placeholder: show that files would be uploaded
      setUploading(true);
      try {
        // In a real implementation, you'd upload through the file manager API
        // and then call addFileToItem with the returned file ID
        onValueChanged?.();
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [onValueChanged]
  );

  const handleRemoveFile = useCallback(
    async (fileId: number) => {
      try {
        await removeFileFromItem(modelId, item.id, fileId);
        onValueChanged?.();
      } catch {
        // silently fail, user can retry
      }
    },
    [modelId, item.id, onValueChanged]
  );

  return (
    <Stack spacing={1}>
      {files.length > 0 && (
        <Stack spacing={0.5}>
          {files.map((file) => (
            <Stack
              key={file.id}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                p: 1,
                borderRadius: 1,
                border: `1px solid ${theme.palette.border.light}`,
                backgroundColor: theme.palette.background.fill,
              }}
            >
              <FileText size={16} color={theme.palette.text.tertiary} />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {file.filename || `File #${file.file_id}`}
              </Typography>
              <IconButton size="small" onClick={() => handleRemoveFile(file.file_id)}>
                <Trash2 size={14} />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      )}
      <Box
        sx={{
          border: `1px dashed ${theme.palette.border.dark}`,
          borderRadius: 1,
          p: 2,
          textAlign: "center",
          cursor: "pointer",
          "&:hover": { backgroundColor: theme.palette.background.accent },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <CircularProgress size={20} />
        ) : (
          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
            <Upload size={16} color={theme.palette.text.tertiary} />
            <Typography variant="body2" color="text.secondary">
              Click to upload documents
            </Typography>
          </Stack>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md"
          onChange={handleFileSelect}
        />
      </Box>
    </Stack>
  );
};

// ============================================================================
// People renderer
// ============================================================================

interface PeopleFieldRendererProps {
  modelId: number;
  item: LifecycleItem;
  value: LifecycleValue | null | undefined;
  onValueChanged?: () => void;
}

const PeopleFieldRenderer = ({
  modelId,
  item,
  value,
  onValueChanged,
}: PeopleFieldRendererProps) => {
  const theme = useTheme();
  const config = item.config as PeopleItemConfig;
  const { users } = useUsers();
  const currentPeople: PeopleValue[] = Array.isArray(value?.value_json)
    ? (value.value_json as PeopleValue[])
    : [];
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>(
    currentPeople.map((p) => p.userId)
  );
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback(
    async (userIds: number[]) => {
      setSelectedUserIds(userIds);
      setSaving(true);
      try {
        const peopleValues: PeopleValue[] = userIds.map((userId) => ({ userId }));
        await upsertItemValue(modelId, item.id, { value_json: peopleValues });
        onValueChanged?.();
      } catch {
        // revert on error
      } finally {
        setSaving(false);
      }
    },
    [modelId, item.id, onValueChanged]
  );

  return (
    <Stack spacing={1}>
      <Select
        multiple
        size="small"
        fullWidth
        value={selectedUserIds}
        onChange={(e) => {
          const val = e.target.value;
          handleChange(typeof val === "string" ? [] : val as number[]);
        }}
        renderValue={(selected) => (
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {(selected as number[]).map((id) => {
              const user = users.find((u) => u.id === id);
              return (
                <Chip
                  key={id}
                  label={user ? `${user.name} ${user.surname}` : `User #${id}`}
                  size="small"
                />
              );
            })}
          </Stack>
        )}
      >
        {users.map((user) => (
          <MenuItem key={user.id} value={user.id}>
            <Checkbox checked={selectedUserIds.includes(user.id)} size="small" />
            <Typography variant="body2">
              {user.name} {user.surname}
            </Typography>
          </MenuItem>
        ))}
      </Select>
      {saving && <CircularProgress size={16} />}
    </Stack>
  );
};

// ============================================================================
// Classification renderer
// ============================================================================

interface ClassificationFieldRendererProps {
  modelId: number;
  item: LifecycleItem;
  value: LifecycleValue | null | undefined;
  onValueChanged?: () => void;
}

const ClassificationFieldRenderer = ({
  modelId,
  item,
  value,
  onValueChanged,
}: ClassificationFieldRendererProps) => {
  const config = item.config as ClassificationItemConfig;
  const levels = config?.levels ?? [];
  const currentValue = (value?.value_json as ClassificationValue)?.level ?? "";
  const [selected, setSelected] = useState(currentValue);
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback(
    async (level: string) => {
      setSelected(level);
      setSaving(true);
      try {
        await upsertItemValue(modelId, item.id, {
          value_json: { level } as ClassificationValue,
        });
        onValueChanged?.();
      } catch {
        // keep selection
      } finally {
        setSaving(false);
      }
    },
    [modelId, item.id, onValueChanged]
  );

  return (
    <Stack spacing={0.5}>
      <RadioGroup
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
      >
        {levels.map((level) => (
          <FormControlLabel
            key={level}
            value={level}
            control={<Radio size="small" />}
            label={<Typography variant="body2">{level}</Typography>}
          />
        ))}
      </RadioGroup>
      {saving && <CircularProgress size={16} />}
    </Stack>
  );
};

// ============================================================================
// Checklist renderer
// ============================================================================

interface ChecklistFieldRendererProps {
  modelId: number;
  item: LifecycleItem;
  value: LifecycleValue | null | undefined;
  onValueChanged?: () => void;
}

const ChecklistFieldRenderer = ({
  modelId,
  item,
  value,
  onValueChanged,
}: ChecklistFieldRendererProps) => {
  const theme = useTheme();
  const config = item.config as ChecklistItemConfig;
  const defaultItems: ChecklistValue[] = (config?.defaultItems ?? []).map(
    (label) => ({ label, checked: false })
  );
  const savedItems: ChecklistValue[] = Array.isArray(value?.value_json)
    ? (value.value_json as ChecklistValue[])
    : defaultItems;
  const [items, setItems] = useState<ChecklistValue[]>(
    savedItems.length > 0 ? savedItems : defaultItems
  );
  const [saving, setSaving] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  const saveItems = useCallback(
    async (updatedItems: ChecklistValue[]) => {
      setSaving(true);
      try {
        await upsertItemValue(modelId, item.id, { value_json: updatedItems });
        onValueChanged?.();
      } catch {
        // keep state
      } finally {
        setSaving(false);
      }
    },
    [modelId, item.id, onValueChanged]
  );

  const toggleItem = useCallback(
    (index: number) => {
      const updated = items.map((it, i) =>
        i === index ? { ...it, checked: !it.checked } : it
      );
      setItems(updated);
      saveItems(updated);
    },
    [items, saveItems]
  );

  const addItem = useCallback(() => {
    if (!newItemText.trim()) return;
    const updated = [...items, { label: newItemText.trim(), checked: false }];
    setItems(updated);
    setNewItemText("");
    saveItems(updated);
  }, [items, newItemText, saveItems]);

  const removeItem = useCallback(
    (index: number) => {
      const updated = items.filter((_, i) => i !== index);
      setItems(updated);
      saveItems(updated);
    },
    [items, saveItems]
  );

  return (
    <Stack spacing={1}>
      {items.map((it, index) => (
        <Stack key={index} direction="row" alignItems="center" spacing={1}>
          <FormControlLabel
            control={
              <Checkbox
                checked={it.checked}
                onChange={() => toggleItem(index)}
                size="small"
              />
            }
            label={
              <Typography
                variant="body2"
                sx={{
                  textDecoration: it.checked ? "line-through" : "none",
                  color: it.checked
                    ? theme.palette.text.tertiary
                    : theme.palette.text.primary,
                }}
              >
                {it.label}
              </Typography>
            }
            sx={{ flex: 1 }}
          />
          <IconButton size="small" onClick={() => removeItem(index)}>
            <X size={14} />
          </IconButton>
        </Stack>
      ))}
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          fullWidth
          placeholder="Add checklist item..."
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
        />
        <Button size="small" variant="outlined" onClick={addItem}>
          Add
        </Button>
      </Stack>
      {saving && <CircularProgress size={16} />}
    </Stack>
  );
};

// ============================================================================
// Approval renderer
// ============================================================================

interface ApprovalFieldRendererProps {
  modelId: number;
  item: LifecycleItem;
  value: LifecycleValue | null | undefined;
  onValueChanged?: () => void;
}

const ApprovalFieldRenderer = ({
  modelId,
  item,
  value,
  onValueChanged,
}: ApprovalFieldRendererProps) => {
  const theme = useTheme();
  const { users } = useUsers();
  const currentApprovals: ApprovalValue[] = Array.isArray(value?.value_json)
    ? (value.value_json as ApprovalValue[])
    : [];
  const [approvals, setApprovals] = useState<ApprovalValue[]>(currentApprovals);
  const [saving, setSaving] = useState(false);

  const saveApprovals = useCallback(
    async (updated: ApprovalValue[]) => {
      setSaving(true);
      try {
        await upsertItemValue(modelId, item.id, { value_json: updated });
        onValueChanged?.();
      } catch {
        // keep state
      } finally {
        setSaving(false);
      }
    },
    [modelId, item.id, onValueChanged]
  );

  const handleStatusChange = useCallback(
    (userId: number, status: "approved" | "rejected") => {
      const updated = approvals.map((a) =>
        a.userId === userId
          ? { ...a, status, date: new Date().toISOString() }
          : a
      );
      setApprovals(updated);
      saveApprovals(updated);
    },
    [approvals, saveApprovals]
  );

  const addApprover = useCallback(
    (userId: number) => {
      if (approvals.find((a) => a.userId === userId)) return;
      const updated = [
        ...approvals,
        { userId, status: "pending" as const },
      ];
      setApprovals(updated);
      saveApprovals(updated);
    },
    [approvals, saveApprovals]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return theme.palette.status.success.bg;
      case "rejected":
        return theme.palette.status.error.bg;
      default:
        return theme.palette.background.fill;
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "approved":
        return theme.palette.status.success.text;
      case "rejected":
        return theme.palette.status.error.text;
      default:
        return theme.palette.text.secondary;
    }
  };

  return (
    <Stack spacing={1}>
      {approvals.map((approval) => {
        const user = users.find((u) => u.id === approval.userId);
        return (
          <Stack
            key={approval.userId}
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              p: 1,
              borderRadius: 1,
              border: `1px solid ${theme.palette.border.light}`,
              backgroundColor: getStatusColor(approval.status),
            }}
          >
            <Typography variant="body2" sx={{ flex: 1, color: getStatusTextColor(approval.status) }}>
              {user ? `${user.name} ${user.surname}` : `User #${approval.userId}`}
            </Typography>
            <Chip
              label={approval.status}
              size="small"
              sx={{
                backgroundColor: getStatusColor(approval.status),
                color: getStatusTextColor(approval.status),
                fontWeight: 500,
              }}
            />
            {approval.status === "pending" && (
              <>
                <IconButton
                  size="small"
                  onClick={() => handleStatusChange(approval.userId, "approved")}
                  sx={{ color: theme.palette.status.success.text }}
                >
                  <Check size={16} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleStatusChange(approval.userId, "rejected")}
                  sx={{ color: theme.palette.status.error.text }}
                >
                  <X size={16} />
                </IconButton>
              </>
            )}
          </Stack>
        );
      })}
      <Select
        size="small"
        fullWidth
        value=""
        displayEmpty
        onChange={(e) => {
          const userId = Number(e.target.value);
          if (userId) addApprover(userId);
        }}
        renderValue={() => (
          <Typography variant="body2" color="text.secondary">
            Add approver...
          </Typography>
        )}
      >
        {users
          .filter((u) => !approvals.find((a) => a.userId === u.id))
          .map((user) => (
            <MenuItem key={user.id} value={user.id}>
              {user.name} {user.surname}
            </MenuItem>
          ))}
      </Select>
      {saving && <CircularProgress size={16} />}
    </Stack>
  );
};

export default LifecycleItemField;
