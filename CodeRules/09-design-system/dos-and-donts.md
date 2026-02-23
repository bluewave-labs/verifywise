# Do's and Don'ts

Quick reference for design system rules.

## Text & Typography

| Do | Don't |
|----|-------|
| Use sentence case for all UI text | Use Title Case or ALL CAPS |
| Use font sizes: 11, 12, 13, 14, 16, 18, 24px | Use arbitrary sizes (15px, 17px, 19px) |
| Use explicit `sx` props for typography | Use MUI Typography variants (h1-h6) |
| Use Geist font family | Use other fonts |

## Colors

| Do | Don't |
|----|-------|
| Use `theme.palette.*` for all colors | Hardcode hex values in components |
| Use status color tokens for feedback | Create custom status colors |
| Use `text.primary` for main text | Use `#000000` for text |
| Use `#d0d5dd` for card borders | Use `#EEEEEE` for card borders |

## Spacing

| Do | Don't |
|----|-------|
| Use `theme.spacing()` (2px base) | Use arbitrary pixel values |
| Use `gap` for flex/grid spacing | Use margins between flex children |
| Use consistent padding patterns | Mix padding approaches in same context |

## Icons

| Do | Don't |
|----|-------|
| Use `lucide-react` for all icons | Use `@mui/icons-material` |
| Use standard sizes: 12, 14, 16, 18, 20, 24px | Use non-standard icon sizes |
| Use 16px icons for buttons | Use different icon sizes for same context |
| Use 14px icons in table actions | Use large icons in tables |
| Use 18px icons for nav items | Mix icon libraries |

## Buttons

| Do | Don't |
|----|-------|
| Use 34px height for standard buttons | Use arbitrary button heights |
| Use ONE primary button per view | Use multiple primary buttons |
| Use sentence case for button text | Use ALL CAPS for button text |
| Disable transitions on buttons | Add hover animations to buttons |

## Borders & Radius

| Do | Don't |
|----|-------|
| Use 4px border radius | Use border radius > 4px |
| Use `#d0d5dd` for borders | Use various border colors |
| Use borders on cards (not shadows) | Use shadows on cards |

## Components

| Do | Don't |
|----|-------|
| Use VerifyWise shared components | Create custom wrappers for standard patterns |
| Use `useStandardModal` for modals | Create custom modal wrappers |
| Use `Popover` for dropdown menus | Use `Menu` for dropdown menus |
| Use `Chip` for status indicators | Create custom status badges |

## Common VerifyWise Components

Use these shared components instead of building from scratch:

| Component | Location |
|-----------|----------|
| Select dropdown | `components/Inputs/Select` |
| Text field | `components/Inputs/Field` |
| Search box | `components/Inputs/SearchBox` |
| Primary button | `components/button` |
| Data table | `components/Table` |
| Standard modal | `components/Modals/StandardModal` |
| Side drawer | `components/Drawer` |
| Tab bar | `components/TabBar` |
| Toast alert | `components/Alert` |
| Empty state | `components/EmptyState` |
| Breadcrumbs | `components/breadcrumbs` |
| Tag chip | `components/Tags/TagChip` |

## Related Documents

- [Component Patterns](./component-patterns.md)
- [Colors](./colors.md)
- [Icons](./icons.md)
- [Typography](./typography.md)
