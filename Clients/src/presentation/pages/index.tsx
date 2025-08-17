import { Stack, Typography, Paper, Divider, useTheme } from "@mui/material";
import { Assessment } from "@mui/icons-material";
import Breadcrumbs, { BreadcrumbItem } from "../components/Breadcrumbs";

const Playground = () => {
  const theme = useTheme();

  // Example 1: Manual breadcrumbs with custom items
  const manualBreadcrumbs: BreadcrumbItem[] = [
    {
      label: "Projects",
      path: "/projects",
    },
    {
      label: "AI Compliance Project",
      path: "/projects/ai-compliance",
    },
    {
      label: "Settings",
      path: "/projects/ai-compliance/settings",
    },
  ];

  // Example 2: Breadcrumbs with disabled items
  const disabledBreadcrumbs: BreadcrumbItem[] = [
    {
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      label: "Reports",
      path: "/reports",
    },
    {
      label: "Compliance Report",
      disabled: true, // This item will be disabled
    },
  ];

  // Example 3: Custom route mapping for auto-generation
  const customRouteMapping: Record<string, string> = {
    "/project-view": "Project Overview",
    "/project-view/risks": "Risk Management",
    "/project-view/settings": "Project Settings",
    "/model-inventory": "Model Inventory",
    "/ai-trust-center": "AI Trust Center",
    "/fairness-dashboard": "Fairness Dashboard",
  };

  // Example 4: Long labels that will be truncated
  const longLabelBreadcrumbs: BreadcrumbItem[] = [
    {
      label: "Home",
      path: "/",
    },
    {
      label:
        "Very Long Project Name That Will Be Truncated Because It Exceeds The Maximum Length",
      path: "/long-project",
    },
    {
      label:
        "Another Extremely Long Section Name That Should Also Be Truncated",
      path: "/long-project/long-section",
    },
  ];

  return (
    <Stack
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        minHeight: "100vh",
        padding: "20px",
        gap: 3,
        backgroundColor: theme.palette.background.alt,
      }}
    >
      <Typography
        variant="h4"
        sx={{ color: theme.palette.text.primary, mb: 2 }}
      >
        Breadcrumbs Component Examples
      </Typography>

      {/* Example 1: Manual breadcrumbs */}
      <Paper sx={{ p: 3, width: "100%", maxWidth: 800 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, color: theme.palette.text.primary }}
        >
          Example 1: Manual Breadcrumbs
        </Typography>
        <Typography
          variant="body2"
          sx={{ mb: 2, color: theme.palette.text.secondary }}
        >
          Custom breadcrumbs with navigation paths
        </Typography>
        <Breadcrumbs items={manualBreadcrumbs} />
      </Paper>

      {/* Example 2: Auto-generated breadcrumbs */}
      <Paper sx={{ p: 3, width: "100%", maxWidth: 800 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, color: theme.palette.text.primary }}
        >
          Example 2: Auto-Generated Breadcrumbs
        </Typography>
        <Typography
          variant="body2"
          sx={{ mb: 2, color: theme.palette.text.secondary }}
        >
          Breadcrumbs automatically generated from current route with custom
          mapping
        </Typography>
        <Breadcrumbs autoGenerate={true} routeMapping={customRouteMapping} />
      </Paper>

      {/* Example 3: Breadcrumbs with disabled items */}
      <Paper sx={{ p: 3, width: "100%", maxWidth: 800 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, color: theme.palette.text.primary }}
        >
          Example 3: Breadcrumbs with Disabled Items
        </Typography>
        <Typography
          variant="body2"
          sx={{ mb: 2, color: theme.palette.text.secondary }}
        >
          Some breadcrumb items can be disabled and won't be clickable
        </Typography>
        <Breadcrumbs items={disabledBreadcrumbs} />
      </Paper>

      {/* Example 4: Custom separator */}
      <Paper sx={{ p: 3, width: "100%", maxWidth: 800 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, color: theme.palette.text.primary }}
        >
          Example 4: Custom Separator
        </Typography>
        <Typography
          variant="body2"
          sx={{ mb: 2, color: theme.palette.text.secondary }}
        >
          Using a custom separator icon (Assessment icon)
        </Typography>
        <Breadcrumbs
          items={manualBreadcrumbs}
          separator={<Assessment fontSize="small" />}
        />
      </Paper>

      {/* Example 5: Truncated labels */}
      <Paper sx={{ p: 3, width: "100%", maxWidth: 800 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, color: theme.palette.text.primary }}
        >
          Example 5: Truncated Labels
        </Typography>
        <Typography
          variant="body2"
          sx={{ mb: 2, color: theme.palette.text.secondary }}
        >
          Long labels are automatically truncated to maintain clean layout
        </Typography>
        <Breadcrumbs
          items={longLabelBreadcrumbs}
          maxLabelLength={25}
          truncateLabels={true}
        />
      </Paper>

      {/* Example 6: Custom styling */}
      <Paper sx={{ p: 3, width: "100%", maxWidth: 800 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, color: theme.palette.text.primary }}
        >
          Example 6: Custom Styling
        </Typography>
        <Typography
          variant="body2"
          sx={{ mb: 2, color: theme.palette.text.secondary }}
        >
          Breadcrumbs with custom styling and background
        </Typography>
        <Breadcrumbs
          items={manualBreadcrumbs}
          sx={{
            backgroundColor: theme.palette.background.fill,
            borderRadius: 1,
            px: 2,
            py: 1,
            border: `1px solid ${theme.palette.border.light}`,
          }}
        />
      </Paper>

      {/* Example 7: Maximum items with collapse */}
      <Paper sx={{ p: 3, width: "100%", maxWidth: 800 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, color: theme.palette.text.primary }}
        >
          Example 7: Maximum Items with Collapse
        </Typography>
        <Typography
          variant="body2"
          sx={{ mb: 2, color: theme.palette.text.secondary }}
        >
          Breadcrumbs with many items that will collapse (maxItems: 3)
        </Typography>
        <Breadcrumbs
          items={[
            { label: "Home", path: "/" },
            { label: "Projects", path: "/projects" },
            { label: "AI Project", path: "/projects/ai" },
            { label: "Compliance", path: "/projects/ai/compliance" },
            { label: "Settings", path: "/projects/ai/compliance/settings" },
            {
              label: "Advanced",
              path: "/projects/ai/compliance/settings/advanced",
            },
          ]}
          maxItems={3}
        />
      </Paper>

      <Divider sx={{ width: "100%", my: 2 }} />

      {/* Usage Instructions */}
      <Paper sx={{ p: 3, width: "100%", maxWidth: 800 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, color: theme.palette.text.primary }}
        >
          Usage Instructions
        </Typography>
        <Stack spacing={2}>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            <strong>Manual Breadcrumbs:</strong> Pass an array of BreadcrumbItem
            objects with labels and paths.
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            <strong>Auto-Generated:</strong> Set autoGenerate=true to
            automatically create breadcrumbs from the current route.
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            <strong>Custom Mapping:</strong> Use routeMapping to provide custom
            labels for specific routes.
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            <strong>Styling:</strong> Use the sx prop to apply custom styles
            that match your design system.
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default Playground;
