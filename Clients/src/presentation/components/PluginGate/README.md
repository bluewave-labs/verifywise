# PluginGate Component & Hook

Reusable utilities for conditional rendering based on plugin installation status.

## Files

- `useIsPluginInstalled.ts` - Custom hook to check if a plugin is installed
- `index.tsx` - PluginGate component for declarative conditional rendering

## Usage

### Option 1: Using the Hook (Programmatic)

Use the `useIsPluginInstalled` hook when you need programmatic access to the plugin installation state.

```tsx
import { useIsPluginInstalled } from "../../../application/hooks/useIsPluginInstalled";

function MyComponent() {
  const { isInstalled, loading, error, installationId } = useIsPluginInstalled("mlflow");

  if (loading) {
    return <Spinner />;
  }

  if (!isInstalled) {
    return <InstallPluginPrompt />;
  }

  return <MLFlowFeature />;
}
```

#### Hook Return Values

- `isInstalled: boolean` - Whether the plugin is installed
- `loading: boolean` - Whether the check is in progress
- `error: string | null` - Any error that occurred during the check
- `installationId: number | null` - The installation ID if installed

### Option 2: Using the Component (Declarative)

Use the `PluginGate` component for cleaner, declarative conditional rendering.

```tsx
import PluginGate from "../../components/PluginGate";

function MyComponent() {
  return (
    <PluginGate pluginKey="mlflow">
      <MLFlowFeature />
    </PluginGate>
  );
}
```

#### With Fallback Content

Show alternative content when the plugin is not installed:

```tsx
<PluginGate
  pluginKey="slack"
  fallback={<InstallSlackPrompt />}
>
  <SlackNotifications />
</PluginGate>
```

#### With Loading and Error States

Show loading spinners and error messages:

```tsx
<PluginGate
  pluginKey="mlflow"
  loading={<CircularProgress />}
  error={<Alert severity="error">Failed to check plugin status</Alert>}
  fallback={<InstallMLFlowPrompt />}
>
  <MLFlowDashboard />
</PluginGate>
```

### Option 3: Conditional Tab Rendering

Conditionally include tabs based on plugin installation:

```tsx
import { useIsPluginInstalled } from "../../../application/hooks/useIsPluginInstalled";

function MyComponent() {
  const { isInstalled: isMlflowInstalled } = useIsPluginInstalled("mlflow");

  const tabs = [
    { label: "Overview", value: "overview" },
    { label: "Details", value: "details" },
    // Only show MLFlow tab if plugin is installed
    ...(isMlflowInstalled
      ? [{ label: "MLFlow Data", value: "mlflow" }]
      : []),
  ];

  return <TabBar tabs={tabs} />;
}
```

## Available Plugins

Current plugin keys:
- `"mlflow"` - MLflow integration
- `"slack"` - Slack integration

## Implementation Example

See `src/presentation/pages/ModelInventory/index.tsx` for a complete implementation example that:
1. Uses the hook to check if MLflow is installed
2. Conditionally includes the MLFlow tab in the tab bar
3. Conditionally renders the MLFlow tab content
4. Redirects to a default tab if user tries to access MLflow without the plugin

## Best Practices

1. **Use the hook** when you need access to the installation state for logic or multiple conditionals
2. **Use the component** for simple conditional rendering of UI elements
3. **Always handle loading states** in user-facing components
4. **Provide fallback content** when appropriate to guide users on what's missing
5. **Cache the plugin status** - Both utilities automatically cache the installed plugins list

## Performance Notes

- The hook fetches installed plugins once per component mount
- The API call is aborted if the component unmounts before completion
- Multiple components using the same hook will each make their own API call (no global cache yet)
- Consider using a global state management solution (React Query, Redux, etc.) if you need to check multiple plugins across many components
