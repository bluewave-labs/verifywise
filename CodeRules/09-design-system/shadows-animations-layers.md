# Shadows, Animations & Z-Index

## Shadows

### Shadow Scale

| Level | Value | Usage |
|-------|-------|-------|
| None | `none` | Default cards, containers (use border instead) |
| Subtle | `0 1px 2px rgba(0,0,0,0.05)` | Slight depth, inputs |
| Default | `0px 4px 24px -4px rgba(16,24,40,0.08), 0px 3px 3px -3px rgba(16,24,40,0.03)` | Dropdowns, popovers, modals |
| Skeleton | `0 8px 30px rgba(0,0,0,.08)` | Empty state skeletons |

### Shadow Usage Rules

| Component | Shadow |
|-----------|--------|
| Cards | None (use `border: 1px solid #d0d5dd`) |
| Dropdowns | `theme.boxShadow` |
| Popovers | `theme.boxShadow` |
| Modals | `theme.boxShadow` |
| Toasts | `theme.boxShadow` |
| Hover state | Optional subtle shadow |

> **Rule:** Cards use borders, not shadows. Only floating elements (dropdowns, modals, toasts) use shadows.

## Animations & Transitions

### Transition Durations

| Duration | Usage |
|----------|-------|
| 0.15s | Micro interactions, tooltips |
| **0.2s** | **Default** — hover states, focus |
| 0.3s | Background changes, larger elements |
| 1.6s | Skeleton pulse (infinite) |
| 3s | Float animation (decorative) |

### Easing Functions

| Easing | Usage |
|--------|-------|
| `ease` | Default for most transitions |
| `ease-in-out` | Hover states, smooth animations |
| `ease-in` | Entering animations |
| `ease-out` | Exiting animations |
| `linear` | Loading spinners |

### Disabled Transitions

These MUI components have transitions explicitly disabled:

- `MuiButton` — `transition: "none"`
- `MuiIconButton` — `transition: "none"`
- `MuiListItemButton` — `transition: "none"`
- `MuiButtonBase` — `disableRipple: true`

### Keyframe Animations

| Animation | Duration | Usage |
|-----------|----------|-------|
| `scaleIn` | 0.2s | Modal entrance (scale 0.95 → 1) |
| `pulse` | 1.6s infinite | Skeleton loading |
| `float` | 3s × 5 | Empty state decorations |
| `fadeIn` | 0.3s | Page tours |
| `fadeOut` | 0.2s | Dismissals |
| `colorWave` | 2s infinite | Login page |

## Z-Index Scale

### Application Layers

| Value | Name | Usage |
|-------|------|-------|
| -1 | Background | Decorative backgrounds, patterns |
| 0 | Base | Default document flow |
| 1 | Raised | Slightly elevated, overlapping items |
| 10 | Dropdown | Dropdown menus, sticky table headers |
| 100 | Sticky | Sticky headers, fixed sidebars |
| 1000 | Modal | Modals, dialogs, overlays |
| 9999 | Toast | Toasts, alerts, top-priority notifications |

### MUI Default Z-Index (reference)

| Component | Value |
|-----------|-------|
| mobileStepper | 1000 |
| fab | 1050 |
| speedDial | 1050 |
| appBar | 1100 |
| drawer | 1200 |
| modal | 1300 |
| snackbar | 1400 |
| tooltip | 1500 |

> Do not override MUI z-index values unless absolutely necessary. Use the application layer values for custom components.

## Related Documents

- [Colors](./colors.md)
- [Component Patterns](./component-patterns.md)
