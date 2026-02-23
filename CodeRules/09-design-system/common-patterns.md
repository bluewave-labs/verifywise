# Common Patterns

Reusable code patterns for common UI tasks in VerifyWise.

## 1. Modal with Form

```tsx
import { useStandardModal } from "@/application/hooks/useStandardModal";
import { useRef } from "react";

function ItemsPage() {
  const submitRef = useRef<(() => void) | null>(null);
  const { openModal, closeModal, StandardModal } = useStandardModal();

  return (
    <>
      <Button onClick={openModal}>Add item</Button>
      <StandardModal title="Add Item" onSubmitRef={submitRef}>
        <ItemForm
          onSubmitRef={submitRef}
          onSuccess={() => {
            closeModal();
            refetchItems();
          }}
        />
      </StandardModal>
    </>
  );
}
```

## 2. Dropdown Menu

```tsx
import { Popover, MenuItem } from "@mui/material";
import { useState } from "react";
import { MoreVertical } from "lucide-react";

function ActionMenu({ onEdit, onDelete }: ActionMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVertical size={16} />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ mt: "4px" }}
      >
        <MenuItem onClick={() => { onEdit(); setAnchorEl(null); }}>
          Edit
        </MenuItem>
        <MenuItem onClick={() => { onDelete(); setAnchorEl(null); }}>
          Delete
        </MenuItem>
      </Popover>
    </>
  );
}
```

## 3. Debounced Search

```tsx
import { useState, useEffect, useMemo } from "react";

function SearchableList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredItems = useMemo(
    () => items.filter((item) =>
      item.name.toLowerCase().includes(debouncedTerm.toLowerCase())
    ),
    [items, debouncedTerm]
  );

  return (
    <>
      <TextField
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        size="small"
      />
      <ItemList items={filteredItems} />
    </>
  );
}
```

## 4. Data Fetch with States

```tsx
import { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";

function DataPage() {
  const [data, setData] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      setLoading(true);
      try {
        const result = await itemRepository.getAll();
        setData(result);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 20 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!data || data.length === 0) {
    return <EmptyState message="No items found" />;
  }

  return <ItemTable items={data} />;
}
```

## 5. Form with Validation

```tsx
import { useState } from "react";

interface FormData {
  name: string;
  email: string;
}

interface FormErrors {
  name?: string;
  email?: string;
}

function ItemForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState<FormData>({ name: "", email: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await itemRepository.create(formData);
      onSuccess();
    } catch (err) {
      setErrors({ name: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <TextField
        label="Name"
        size="small"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={!!errors.name}
        helperText={errors.name}
      />
      <TextField
        label="Email"
        size="small"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={!!errors.email}
        helperText={errors.email}
      />
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "Saving..." : "Save"}
      </Button>
    </Box>
  );
}
```

## 6. Data Table with Actions

```tsx
import { Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import { Edit, Trash2 } from "lucide-react";

function ItemTable({ items, onEdit, onDelete }: ItemTableProps) {
  if (items.length === 0) {
    return <EmptyState message="No items found" />;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase" }}>
            Name
          </TableCell>
          <TableCell sx={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase" }}>
            Status
          </TableCell>
          <TableCell align="right" sx={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase" }}>
            Actions
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} hover>
            <TableCell sx={{ fontSize: 13 }}>{item.name}</TableCell>
            <TableCell>
              <Chip
                label={item.status}
                size="small"
                sx={{ fontSize: 12, fontWeight: 500 }}
              />
            </TableCell>
            <TableCell align="right">
              <IconButton size="small" onClick={() => onEdit(item)}>
                <Edit size={14} />
              </IconButton>
              <IconButton size="small" onClick={() => onDelete(item.id)}>
                <Trash2 size={14} color="#f04438" />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Related Documents

- [Component Patterns](./component-patterns.md)
- [Do's and Don'ts](./dos-and-donts.md)
- [Spacing](./spacing.md)
