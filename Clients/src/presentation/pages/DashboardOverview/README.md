# VerifyWise Drag-and-Drop Dashboard

A comprehensive, customizable dashboard system for VerifyWise with drag-and-drop functionality, responsive layouts, and persistent state management.

## Features

- **🎯 Drag-and-Drop Layout**: Rearrange widgets by dragging their headers
- **📐 Resizable Widgets**: Adjust widget sizes with configurable min/max constraints
- **🔄 Edit/View Modes**: Toggle between interactive edit mode and static view mode
- **💾 Persistent Layouts**: Automatically saves layouts to localStorage
- **📱 Responsive Design**: Adapts to different screen sizes with breakpoint-specific layouts
- **🎨 Visual Feedback**: Smooth animations, shadows, and hover effects during interaction
- **🔌 Modular Widgets**: Easy-to-extend widget system with TypeScript support
- **🚀 Context-Based State**: Centralized state management using React Context
- **⚙️ Configurable**: Per-project, per-user dashboard configurations

## Quick Start

### Basic Usage

```tsx
import { EnhancedDashboard } from './DashboardOverview/EnhancedDashboard';

function App() {
  return <EnhancedDashboard />;
}
```

### With Toggle Between Classic and Grid Views

```tsx
import { DashboardWithToggle } from './DashboardOverview/DashboardWithToggle';
import OriginalDashboard from './DashboardOverview';

function App() {
  return <DashboardWithToggle OriginalDashboard={OriginalDashboard} />;
}
```

## File Structure

```
DashboardOverview/
├── EnhancedDashboard.tsx       # Main enhanced dashboard component
├── DragDropDashboard.tsx       # Basic drag-drop implementation
├── DashboardWithToggle.tsx     # Toggle between classic/grid views
├── contexts/
│   └── DashboardContext.tsx    # State management context
├── types/
│   └── dashboard.types.ts      # TypeScript type definitions
├── widgets/
│   ├── index.ts                # Widget exports
│   ├── MetricsWidget.tsx       # Metrics display widget
│   ├── ProjectsWidget.tsx      # Projects list widget
│   └── RisksWidget.tsx         # Risk overview widget
└── README.md                   # This file
```

## Key Components

### EnhancedDashboard
The main dashboard component with full features including:
- Edit mode toggle
- Settings menu (reset, export, import)
- Refresh functionality
- Visual mode indicators

### DashboardContext
Provides centralized state management:
- Layout persistence
- Widget data management
- Edit mode control
- Import/export functionality

### Widget System
Modular widget components that can be:
- Independently loaded
- Refreshed on demand
- Configured with min/max dimensions
- Extended with custom props

## Widget Configuration

Each widget can be configured with:

```typescript
interface WidgetConfig {
  id: string;                  // Unique identifier
  title: string;               // Display title
  type: WidgetType;           // Widget type enum
  minW?: number;              // Minimum width (grid units)
  maxW?: number;              // Maximum width
  minH?: number;              // Minimum height
  maxH?: number;              // Maximum height
  defaultW?: number;          // Default width
  defaultH?: number;          // Default height
  refreshInterval?: number;   // Auto-refresh interval (ms)
  customProps?: Record<string, any>;  // Custom properties
}
```

## Adding New Widgets

1. Create a new widget component in `widgets/`:

```tsx
// widgets/CustomWidget.tsx
export const CustomWidget: React.FC<CustomWidgetProps> = ({ data }) => {
  return (
    <Box>
      {/* Your widget content */}
    </Box>
  );
};
```

2. Add to widget exports:

```tsx
// widgets/index.ts
export { CustomWidget } from './CustomWidget';
```

3. Add to widget configuration:

```tsx
// EnhancedDashboard.tsx
const widgets: WidgetConfig[] = [
  // ... existing widgets
  {
    id: 'custom',
    title: 'Custom Widget',
    type: WidgetType.CUSTOM,
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 4,
  }
];
```

4. Add rendering case:

```tsx
// In renderWidget function
case WidgetType.CUSTOM:
  return <CustomWidget data={widgetData} />;
```

## Layout Persistence

Layouts are automatically saved to localStorage with the following schema:

```typescript
interface LayoutPersistence {
  version: string;
  projectId: string;
  dashboardId: string;
  userId: string;
  layouts: Layouts;
  widgets: string[];
  lastModified: string;
  preferences?: DashboardPreferences;
}
```

Storage keys follow the pattern:
`verifywise_dashboard_layouts_${projectId}_${dashboardId}_${userId}`

## Customization

### Theme Integration
The dashboard uses MUI theme for consistent styling:
- Primary color for active states
- Grey palette for backgrounds
- Theme shadows for elevation

### CSS Classes
- `.dashboard-card-header` - Drag handle area
- `.widget-card` - Widget container
- `.no-drag` - Exclude elements from drag

### Responsive Breakpoints
```javascript
breakpoints: {
  lg: 1200,  // 12 columns
  md: 996,   // 10 columns
  sm: 768,   // 6 columns
  xs: 480,   // 4 columns
}
```

## API Integration (Future)

The dashboard is prepared for backend integration:

```typescript
// In DashboardContext
const saveLayout = async (layouts: Layouts) => {
  // Save to localStorage (implemented)
  saveLayoutsToStorage(layouts);

  // Save to backend (to be implemented)
  // await api.saveDashboardLayout(projectId, dashboardId, layouts);
};
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

- `react-grid-layout`: ^1.4.0
- `@mui/material`: ^5.x
- `react`: ^18.x
- `typescript`: ^5.x

## Performance Considerations

- Widgets render independently
- Layout changes are debounced
- LocalStorage operations are async
- CSS transforms for smooth animations

## Known Limitations

- Maximum 50 widgets per dashboard (performance)
- LocalStorage limit of 5MB per domain
- Drag preview may lag with complex widgets

## Future Enhancements

- [ ] Multiple dashboards per project
- [ ] Backend persistence API
- [ ] Widget library/marketplace
- [ ] Custom widget builder
- [ ] Sharing and permissions
- [ ] Export to PDF/Image
- [ ] Keyboard shortcuts
- [ ] Undo/Redo functionality

## License

© 2024 VerifyWise. All rights reserved.