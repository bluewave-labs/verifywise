# Breakpoints & Responsive Design

MUI breakpoint values used in VerifyWise.

## Breakpoint Values

| Name | Value | Target |
|------|-------|--------|
| `xs` | 0px | Phones |
| `sm` | 600px | Tablets (portrait) |
| `md` | 900px | Tablets (landscape) — **primary mobile/desktop split** |
| `lg` | 1200px | Desktops |
| `xl` | 1536px | Wide screens |

## Breakpoint Helpers

```tsx
// In theme or sx prop
theme.breakpoints.up('md')        // >= 900px
theme.breakpoints.down('md')      // < 900px
theme.breakpoints.only('md')      // 900–1199px
theme.breakpoints.between('sm', 'lg')  // 600–1199px
```

## Common Responsive Patterns

```tsx
// Show on desktop only (hide on mobile)
<Box sx={{ display: { xs: 'none', md: 'block' } }}>
  Desktop content
</Box>

// Show on mobile only (hide on desktop)
<Box sx={{ display: { xs: 'block', md: 'none' } }}>
  Mobile content
</Box>

// Stack on mobile, row on desktop
<Box sx={{ flexDirection: { xs: 'column', md: 'row' } }}>
  <Item />
  <Item />
</Box>

// Full width on mobile, half on desktop
<Box sx={{ width: { xs: '100%', md: '50%' } }}>
  Content
</Box>

// Responsive padding
<Box sx={{ p: { xs: 4, md: 8 } }}>  {/* 8px mobile, 16px desktop */}
  Content
</Box>
```

## useMediaQuery

```tsx
import { useMediaQuery, useTheme } from '@mui/material';

function ResponsiveComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  return isMobile ? <MobileView /> : <DesktopView />;
}
```

## Device Categories

| Category | Breakpoints | Usage |
|----------|-------------|-------|
| Mobile | xs, sm (< 900px) | Stack layouts, full-width elements |
| Tablet | sm, md (600–1200px) | Adaptive grids |
| Desktop | md+ (>= 900px) | Side-by-side layouts |
| Wide | lg+ (>= 1200px) | Multi-column layouts |

## Related Documents

- [Spacing](./spacing.md)
- [Component Patterns](./component-patterns.md)
