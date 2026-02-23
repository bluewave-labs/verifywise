# UI Component Patterns

Standard patterns for common UI components in VerifyWise.

## Buttons

| Property | Value |
|----------|-------|
| Height | 34px |
| Padding | `8px 12px` |
| Font size | 13px |
| Font weight | 500 |
| Border radius | 4px |
| Text case | Sentence case |

```tsx
// Primary action (one per view)
<Button variant="contained" color="primary">Save changes</Button>

// Secondary action
<Button variant="outlined">Cancel</Button>

// Destructive action
<Button variant="contained" color="error">Delete</Button>

// Icon button (table actions)
<IconButton size="small">
  <Edit size={14} />
</IconButton>
```

**Rules:**
- Only ONE primary button per view/modal
- Use sentence case, never TITLE CASE or ALL CAPS
- Use 34px height consistently
- Transitions are disabled on buttons

## Form Inputs

| Property | Value |
|----------|-------|
| Height | 34px (matching buttons) |
| Font size | 13px |
| Border | `1px solid #d0d5dd` |
| Border radius | 4px |
| Label | 13px, weight 500, `mb: 4px` above input |

```tsx
// Text field
<TextField
  label="Name"
  size="small"
  fullWidth
  error={!!errors.name}
  helperText={errors.name}
/>

// Select dropdown
<Select size="small" fullWidth>
  <MenuItem value="option1">Option 1</MenuItem>
</Select>
```

**Rules:**
- Error messages use 11px, below the field
- Placeholder text uses `text.accent` color
- Labels always above inputs, never floating

## Tables

| Property | Value |
|----------|-------|
| Header font | 12px, weight 500, uppercase |
| Cell font | 13px, weight 400 |
| Row hover | Subtle background change |
| Actions | Right-aligned, 14px icons |

```tsx
// Table action buttons
<IconButton size="small" onClick={handleEdit}>
  <Edit size={14} />
</IconButton>
<IconButton size="small" onClick={handleDelete}>
  <Trash2 size={14} color="#f04438" />
</IconButton>
```

**Rules:**
- Always handle empty state
- Right-align action columns
- Use `IconButton size="small"` for table actions
- Use 14px icons in tables

## Modals

Use `useStandardModal` hook for consistent modal behavior.

```tsx
import { useStandardModal } from "@/application/hooks/useStandardModal";

function MyPage() {
  const { openModal, closeModal, StandardModal } = useStandardModal();

  return (
    <>
      <Button onClick={openModal}>Open</Button>
      <StandardModal title="Edit Item" onSubmitRef={submitRef}>
        <MyForm onSubmitRef={submitRef} onSuccess={closeModal} />
      </StandardModal>
    </>
  );
}
```

**Rules:**
- Pass `onSubmitRef` to child forms
- Call `closeModal` in the `onSuccess` callback
- Modal background: `#FCFCFD`
- Modal padding: `24px 32px`

## Dropdowns / Popovers

```tsx
const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

<Button onClick={(e) => setAnchorEl(e.currentTarget)}>Options</Button>
<Popover
  open={Boolean(anchorEl)}
  anchorEl={anchorEl}
  onClose={() => setAnchorEl(null)}
  sx={{ mt: "4px" }}
>
  <MenuItem onClick={() => { handleAction(); setAnchorEl(null); }}>
    Action
  </MenuItem>
</Popover>
```

**Rules:**
- Use `Popover` over `Menu` for dropdowns
- Add `mt: 4px` for proper spacing below trigger
- Close popover on item selection

## Status Indicators

```tsx
// Chip/badge for status
<Chip
  label="Active"
  size="small"
  sx={{
    bgcolor: theme.palette.status.success.bg,
    color: theme.palette.status.success.text,
    fontSize: 12,
    fontWeight: 500,
  }}
/>

// Dot indicator
<Box
  sx={{
    width: 8,
    height: 8,
    borderRadius: "50%",
    bgcolor: "status.success.main",
  }}
/>
```

## Loading States

```tsx
// Inline loading
<CircularProgress size={24} />

// Full-page loading
<Box sx={{ display: "flex", justifyContent: "center", py: 20 }}>
  <CircularProgress />
</Box>

// Skeleton loading
<Skeleton variant="text" width="60%" height={32} />
<Skeleton variant="rectangular" height={200} />
```

## Empty States

```tsx
<Box sx={{ textAlign: "center", py: 20 }}>
  <FileText size={48} color="#667085" />
  <Typography sx={{ mt: 4, fontSize: 16, fontWeight: 600 }}>
    No items found
  </Typography>
  <Typography sx={{ mt: 2, fontSize: 13, color: "text.tertiary" }}>
    Create your first item to get started.
  </Typography>
  <Button variant="contained" sx={{ mt: 6 }}>
    Create item
  </Button>
</Box>
```

## Tooltips

```tsx
<Tooltip title="Edit this item" arrow>
  <IconButton size="small">
    <Edit size={14} />
  </IconButton>
</Tooltip>
```

## Tabs

```tsx
import TabBar from "@/presentation/components/TabBar";

<TabBar
  tabs={["Overview", "Details", "History"]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

## Related Documents

- [Do's and Don'ts](./dos-and-donts.md)
- [Colors](./colors.md)
- [Spacing](./spacing.md)
- [Icons](./icons.md)
