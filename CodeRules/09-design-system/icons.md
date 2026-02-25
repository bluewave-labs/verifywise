# Icons

VerifyWise uses **lucide-react** for all icons. Do NOT use `@mui/icons-material`.

## Import Pattern

```tsx
// Individual imports (tree-shakeable)
import { Edit, Trash2, Plus, Search } from "lucide-react";

// Usage
<Edit size={16} />
<Trash2 size={16} color="#f04438" />
<Plus size={14} strokeWidth={2} />
```

## Standard Sizes

| Size | Usage |
|------|-------|
| 12px | Inline text, badges |
| 14px | Tab icons, small buttons, table actions |
| 16px | Buttons, inputs (default) |
| 18px | Nav items, section icons |
| 20px | Cards, medium emphasis |
| 24px | Headers, large emphasis |

Do NOT use non-standard sizes like 15px, 17px, 19px.

## Stroke Width

| Value | Usage |
|-------|-------|
| 1.5 | Thinner/lighter icons |
| 2 | Default |
| 2.5 | Bolder emphasis |

## Icon Color Tokens

| Purpose | Color |
|---------|-------|
| Default | `#667085` (text.tertiary) |
| Primary | `#13715B` (primary.main) |
| Success | `#17b26a` |
| Error | `#f04438` |
| Warning | `#fdb022` |

## Common Icons by Category

### Navigation & UI
`ChevronDown`, `ChevronUp`, `ChevronLeft`, `ChevronRight`, `ChevronsLeft`, `ChevronsRight`, `ArrowLeft`, `ArrowRight`, `X`, `Check`, `Plus`, `Minus`, `MoreHorizontal`, `MoreVertical`, `Menu`, `Search`, `Filter`, `Settings`, `Home`

### Actions
`Edit`, `Trash2`, `Copy`, `Download`, `Upload`, `Save`, `Share`, `Link`, `ExternalLink`, `Eye`, `EyeOff`, `Lock`, `Unlock`, `RefreshCw`, `RotateCcw`

### Status & Feedback
`AlertCircle`, `AlertTriangle`, `CheckCircle`, `XCircle`, `Info`, `HelpCircle`, `Bell`, `BellOff`

### Content
`File`, `FileText`, `Folder`, `FolderOpen`, `Image`, `Calendar`, `Clock`, `Mail`, `MessageSquare`, `MessageCircle`

### Users
`User`, `Users`, `UserPlus`, `UserMinus`, `UserCircle`

### Data
`BarChart`, `PieChart`, `TrendingUp`, `TrendingDown`, `Activity`

### Objects
`Box`, `Package`, `Shield`, `ShieldCheck`, `Flag`, `Tag`, `Bookmark`, `Star`, `Heart`, `ThumbsUp`

### Layout
`Layout`, `LayoutGrid`, `LayoutList`, `Layers`, `Grid`, `Table`, `Table2`, `Columns`, `Rows`

## Related Documents

- [Colors](./colors.md)
- [Component Patterns](./component-patterns.md)
- [Do's and Don'ts](./dos-and-donts.md)
