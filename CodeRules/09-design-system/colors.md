# Colors

Complete color palette for the VerifyWise design system. Always use theme tokens — never hardcode hex values.

## Primary

| Token | Value | Usage |
|-------|-------|-------|
| `primary.main` | `#13715B` | Brand green, primary actions |
| `primary.hover` | `#0f604d` | Hover state for primary |
| `primary.light` | `#5FA896` | Light variant |
| `primary.focusRing` | `rgba(19,113,91,0.1)` | Focus outline |

## Text

| Token | Value | Usage |
|-------|-------|-------|
| `text.primary` | `#1c2130` | Main body text (contrast 21:1) |
| `text.secondary` | `#344054` | Supporting text (contrast 10:1) |
| `text.tertiary` | `#475467` | Muted text, placeholders (contrast 6.4:1) |
| `text.accent` | `#838c99` | Hints, disabled text |

## Backgrounds

| Token | Value | Usage |
|-------|-------|-------|
| `background.main` | `#FFFFFF` | Page background |
| `background.alt` | `#FCFCFD` | Alternate panels |
| `background.modal` | `#FCFCFD` | Modal background |
| `background.fill` | `#F4F4F4` | Fill areas, secondary |
| `background.accent` | `#f9fafb` | Subtle accent areas |

## Borders

| Token | Value | Usage |
|-------|-------|-------|
| `border.light` | `#eaecf0` | Subtle separators |
| `border.dark` | `#d0d5dd` | Default borders, dividers |

> **Standard border:** Use `#d0d5dd` for card borders and dividers.
> Never use `#EEEEEE` for card borders.

## Status Colors

### Success

| Token | Value | Usage |
|-------|-------|-------|
| `status.success.text` | `#079455` | Success text |
| `status.success.main` | `#17b26a` | Success indicators |
| `status.success.light` | `#d4f4e1` | Light background |
| `status.success.bg` | `#ecfdf3` | Badge/chip background |

### Error

| Token | Value | Usage |
|-------|-------|-------|
| `status.error.text` | `#f04438` | Error text (contrast 4.5:1) |
| `status.error.main` | `#d32f2f` | Error indicators |
| `status.error.light` | `#fbd1d1` | Light background |
| `status.error.bg` | `#f9eced` | Badge/chip background |
| `status.error.border` | `#FDA29B` | Error borders |

### Warning

| Token | Value | Usage |
|-------|-------|-------|
| `status.warning.text` | `#DC6803` | Warning text |
| `status.warning.main` | `#fdb022` | Warning indicators |
| `status.warning.light` | `#ffecbc` | Light background |
| `status.warning.bg` | `#fffcf5` | Badge/chip background |
| `status.warning.border` | `#fec84b` | Warning borders |

### Info

| Token | Value | Usage |
|-------|-------|-------|
| `status.info.text` | `#1c2130` | Info text |
| `status.info.main` | `#475467` | Info indicators |
| `status.info.bg` | `#FFFFFF` | Info background |
| `status.info.border` | `#d0d5dd` | Info borders |

## Button Colors

| Purpose | Value |
|---------|-------|
| Primary | `#13715B` |
| Secondary | `#6B7280` |
| Success | `#059669` |
| Warning | `#D97706` |
| Error | `#DB504A` |
| Info | `#3B82F6` |

## Other Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Icon default | `#667085` | Default icon color |
| Line | `#d6d9dd` | Thin lines |
| Fill | `#e3e3e3` | Fill areas |
| Grid | `#a2a3a3` | Grid lines |

## Usage in Code

```tsx
// Always use theme references
<Box sx={{ color: "text.primary", bgcolor: "background.main" }} />
<Typography color="text.secondary">Muted text</Typography>
<Box sx={{ borderColor: "border.dark" }} />

// Using theme object
<Box sx={{ color: (theme) => theme.palette.primary.main }} />

// Status colors with theme
<Chip sx={{ bgcolor: (theme) => theme.palette.status.success.bg }} />
```

## Related Documents

- [Typography](./typography.md)
- [Do's and Don'ts](./dos-and-donts.md)
- [Accessibility](./accessibility.md)
