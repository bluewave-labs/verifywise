/**
 * LifecycleItemField - Renders the correct field UI based on item_type.
 */

import { useState, useCallback, useRef } from "react";
import {
  Stack,
  TextField,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  Select,
  MenuItem,
  IconButton,
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
  TextItemConfig,
  TextareaItemConfig,
} from "../../../../../domain/interfaces/i.modelLifecycle";
import {
  upsertItemValue,
  addFileToItem,
  removeFileFromItem,
} from "../../../../../application/repository/modelLifecycle.repository";
import { uploadFileToManager } from "../../../../../application/repository/file.repository";
import useUsers from "../../../../../application/hooks/useUsers";
import { getInputStyles, getSelectStyles } from "../../../../utils/inputStyles";
import Chip from "../../../../components/Chip";
import { CustomizableButton } from "../../../../components/button/customizable-button";

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
  const theme = useTheme();
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
    <Stack sx={getInputStyles(theme)}>
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
            <CircularProgress size={14} />
          ) : undefined,
        }}
        sx={{
          "& .MuiInputBase-root": {
            height: multiline ? "auto" : "34px",
            fontSize: "13px",
          },
        }}
      />
    </Stack>
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

      setUploading(true);
      try {
        for (const file of Array.from(selectedFiles)) {
          const result = await uploadFileToManager({ file, source: "File Manager" });
          await addFileToItem(modelId, item.id, result.data.id);
        }
        onValueChanged?.();
      } catch {
        // upload failed — user can retry
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [modelId, item.id, onValueChanged]
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
    <Stack sx={{ gap: "12px" }}>
      {files.length > 0 && (
        <Stack sx={{ gap: "8px" }}>
          {files.map((file) => (
            <Stack
              key={file.id}
              direction="row"
              alignItems="center"
              sx={{
                gap: "8px",
                p: "8px",
                borderRadius: "4px",
                border: `1px solid ${theme.palette.border.light}`,
                backgroundColor: "#f9fafb",
              }}
            >
              <FileText size={16} color={theme.palette.text.tertiary} />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {file.filename || `File #${file.file_id}`}
              </Typography>
              <IconButton size="small" onClick={() => handleRemoveFile(file.file_id)} aria-label="Remove file">
                <Trash2 size={14} />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      )}
      <Box
        sx={{
          border: "1px dashed #d0d5dd",
          borderRadius: "4px",
          p: "16px",
          textAlign: "center",
          cursor: "pointer",
          "&:hover": { backgroundColor: theme.palette.background.accent },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <CircularProgress size={20} />
        ) : (
          <Stack direction="row" sx={{ gap: "8px", justifyContent: "center", alignItems: "center" }}>
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
    <Stack sx={{ gap: "8px" }}>
      <Select
        multiple
        size="small"
        fullWidth
        value={selectedUserIds}
        onChange={(e) => {
          const val = e.target.value;
          handleChange(typeof val === "string" ? [] : val as number[]);
        }}
        sx={{
          ...getSelectStyles(theme),
          "& .MuiInputBase-root": { minHeight: "34px" },
        }}
        renderValue={(selected) => (
          <Stack direction="row" sx={{ gap: "4px", flexWrap: "wrap" }}>
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
      {saving && <CircularProgress size={14} />}
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
    <Stack sx={{ gap: "8px" }}>
      <RadioGroup
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
      >
        <Stack sx={{ gap: "8px" }}>
          {levels.map((level) => (
            <FormControlLabel
              key={level}
              value={level}
              control={
                <Radio
                  size="small"
                  sx={{
                    color: "#d0d5dd",
                    "&.Mui-checked": { color: "#13715B" },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: "13px" }}>
                  {level}
                </Typography>
              }
            />
          ))}
        </Stack>
      </RadioGroup>
      {saving && <CircularProgress size={14} />}
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
    <Stack sx={{ gap: "8px" }}>
      {items.map((it, index) => (
        <Stack key={index} direction="row" alignItems="center" sx={{ gap: "8px" }}>
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
                  fontSize: "13px",
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
          <IconButton size="small" onClick={() => removeItem(index)} aria-label="Remove item">
            <X size={14} />
          </IconButton>
        </Stack>
      ))}
      <Stack direction="row" sx={{ gap: "8px" }}>
        <Stack sx={{ ...getInputStyles(theme), flex: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Add checklist item..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            sx={{
              "& .MuiInputBase-root": {
                height: "34px",
                fontSize: "13px",
              },
            }}
          />
        </Stack>
        <CustomizableButton
          variant="outlined"
          size="small"
          onClick={addItem}
          ariaLabel="Add checklist item"
        >
          Add
        </CustomizableButton>
      </Stack>
      {saving && <CircularProgress size={14} />}
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

  return (
    <Stack sx={{ gap: "12px" }}>
      {approvals.map((approval) => {
        const user = users.find((u) => u.id === approval.userId);
        return (
          <Stack
            key={approval.userId}
            direction="row"
            alignItems="center"
            sx={{
              gap: "8px",
              p: "12px",
              borderRadius: "4px",
              border: `1px solid ${theme.palette.border.light}`,
            }}
          >
            <Typography variant="body2" sx={{ flex: 1 }}>
              {user ? `${user.name} ${user.surname}` : `User #${approval.userId}`}
            </Typography>
            <Chip label={approval.status} />
            {approval.status === "pending" && (
              <>
                <IconButton
                  size="small"
                  onClick={() => handleStatusChange(approval.userId, "approved")}
                  sx={{ color: theme.palette.status.success.text }}
                  aria-label="Approve"
                >
                  <Check size={16} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleStatusChange(approval.userId, "rejected")}
                  sx={{ color: theme.palette.status.error.text }}
                  aria-label="Reject"
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
        sx={{
          ...getSelectStyles(theme),
          "& .MuiInputBase-root": { height: "34px" },
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
      {saving && <CircularProgress size={14} />}
    </Stack>
  );
};

export default LifecycleItemField;
