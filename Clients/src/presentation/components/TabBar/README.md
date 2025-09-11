# TabBar Component

A reusable tab bar component for VerifyWise applications with consistent styling and no ripple effects.

## Features

- Clean, professional appearance with VerifyWise design system colors
- No ripple effects on tab interactions
- Fully accessible with proper ARIA attributes
- Supports both controlled and uncontrolled modes
- Customizable colors and styling
- TypeScript support

## Usage

### Basic Usage
```typescript
import TabBar from '@/presentation/vw-v2-components/TabBar';

<TabBar tabs={["Tab 1", "Tab 2", "Tab 3"]} />
```

### Controlled Mode
```typescript
const [activeTab, setActiveTab] = useState(0);

<TabBar 
  tabs={["Heat Map", "Timeline", "Categories"]}
  value={activeTab}
  onChange={(event, newValue) => setActiveTab(newValue)}
/>
```

### Custom Styling
```typescript
<TabBar 
  tabs={["Tab 1", "Tab 2"]}
  indicatorColor="#FF0000"
  selectedTextColor="#FF0000"
  backgroundColor="#F0F0F0"
  borderColor="#CCCCCC"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | `string[]` | Required | Array of tab labels |
| `value` | `number` | `undefined` | Current active tab index (controlled mode) |
| `onChange` | `(event, newValue) => void` | `undefined` | Tab change handler |
| `variant` | `"standard" \| "scrollable" \| "fullWidth"` | `"standard"` | Tab layout variant |
| `indicatorColor` | `string` | `"#13715B"` | Active tab indicator color |
| `textColor` | `string` | `"#6B7280"` | Default tab text color |
| `selectedTextColor` | `string` | `"#13715B"` | Active tab text color |
| `backgroundColor` | `string` | `"#FCFCFD"` | Tab bar background color |
| `borderColor` | `string` | `"#E5E7EB"` | Border and divider color |
| `sx` | `object` | `{}` | Additional Material-UI sx styling |

## Design System Colors

- **Background**: `#FCFCFD` (VerifyWise light background)
- **Border**: `#E5E7EB` (VerifyWise light gray stroke)
- **Text**: `#6B7280` (VerifyWise secondary text)
- **Active**: `#13715B` (VerifyWise primary green)