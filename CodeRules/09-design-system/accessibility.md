# Accessibility

WCAG 2.1 compliance guidelines for VerifyWise.

## Compliance Levels

### Required (Level A)

- All images have `alt` text
- Form inputs have associated labels
- Color is not the only indicator of meaning
- All functionality is keyboard accessible
- No keyboard traps
- Pages have descriptive titles
- Link purpose is clear from text

### Required (Level AA)

- Text contrast ratio: **4.5:1** minimum
- Large text contrast: **3:1** minimum
- Text can be resized to 200% without loss
- Focus indicator is visible

### Recommended (Level AAA)

- Text contrast ratio: **7:1**
- Headings in logical order (h1 → h2 → h3)

## Color Contrast (VerifyWise Palette)

| Token | Color | Contrast vs White | Meets AA? |
|-------|-------|-------------------|-----------|
| `text.primary` | `#1c2130` | 21:1 | Yes |
| `text.secondary` | `#344054` | 10:1 | Yes |
| `text.tertiary` | `#475467` | 6.4:1 | Yes |
| `primary` | `#13715B` | 5.5:1 | Yes |
| `error.text` | `#f04438` | 4.5:1 | Yes (borderline) |

## ARIA Attributes

### Labels

```tsx
// aria-label: direct label
<IconButton aria-label="Delete item">
  <Trash2 size={16} />
</IconButton>

// aria-labelledby: reference existing element
<Dialog aria-labelledby="dialog-title">
  <DialogTitle id="dialog-title">Edit User</DialogTitle>
</Dialog>

// aria-describedby: additional context
<TextField
  aria-describedby="email-help"
  label="Email"
/>
<FormHelperText id="email-help">We won't share your email</FormHelperText>
```

### State

```tsx
// Toggles
<Button aria-expanded={isOpen} onClick={toggle}>Menu</Button>

// Selection
<Tab aria-selected={isActive}>Overview</Tab>

// Loading
<Button aria-busy={isLoading} disabled={isLoading}>
  {isLoading ? "Saving..." : "Save"}
</Button>

// Hide decorative elements
<Box aria-hidden="true">
  <DecorativeIcon />
</Box>
```

### Live Regions

```tsx
// Non-urgent updates
<Box aria-live="polite" role="status">
  3 items found
</Box>

// Urgent updates (errors)
<Alert aria-live="assertive" role="alert">
  Failed to save changes
</Alert>
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move to next focusable element |
| `Shift+Tab` | Move to previous focusable element |
| `Enter` / `Space` | Activate buttons |
| `Arrow keys` | Navigate within widgets (tabs, menus) |
| `Escape` | Close modals, dropdowns |
| `Home` / `End` | Jump to start/end of list |

### Focus Management

```tsx
// Focus trap in modals (MUI handles this automatically)
<Dialog open={open} onClose={onClose}>
  {/* Focus is trapped inside */}
</Dialog>

// Return focus to trigger on close (MUI handles this)

// Manual focus for custom components
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => {
  if (isVisible) inputRef.current?.focus();
}, [isVisible]);
```

### Custom Clickable Elements

```tsx
// If using a non-button as clickable, add keyboard support
<Box
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Custom clickable element
</Box>
```

## Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Focus order follows visual layout
- [ ] Focus indicator is visible (not removed)
- [ ] Modals trap focus and return focus on close
- [ ] Color is not the only way to convey information (add icons/text)
- [ ] Images have meaningful `alt` text (or `alt=""` for decorative)
- [ ] Form fields have visible labels
- [ ] Error messages are announced to screen readers
- [ ] Dynamic content uses `aria-live` regions
- [ ] Text contrast meets 4.5:1 minimum

## Related Documents

- [Colors](./colors.md) — contrast ratios
- [Component Patterns](./component-patterns.md) — accessible component examples
- [Do's and Don'ts](./dos-and-donts.md)
