import React, { ReactNode } from "react";
import { useIsPluginInstalled } from "../../../application/hooks/useIsPluginInstalled";

interface PluginGateProps {
  /**
   * The plugin key to check for installation (e.g., "mlflow", "slack")
   */
  pluginKey: string;

  /**
   * Content to render when the plugin is installed
   */
  children: ReactNode;

  /**
   * Optional content to render when the plugin is not installed
   * If not provided, nothing will be rendered when plugin is not installed
   */
  fallback?: ReactNode;

  /**
   * Optional content to render while checking plugin installation
   * If not provided, nothing will be rendered during loading
   */
  loading?: ReactNode;

  /**
   * Optional content to render when there's an error checking plugin installation
   * If not provided, nothing will be rendered on error
   */
  error?: ReactNode;
}

/**
 * PluginGate component - Conditionally renders children based on plugin installation
 *
 * This component checks if a specific plugin is installed and only renders
 * its children if the plugin is installed. Optionally shows fallback content
 * when the plugin is not installed, loading content during the check, or
 * error content if the check fails.
 *
 * @example
 * ```tsx
 * // Simple usage - only show content if MLflow is installed
 * <PluginGate pluginKey="mlflow">
 *   <MLFlowDataTable />
 * </PluginGate>
 *
 * // With fallback content
 * <PluginGate
 *   pluginKey="mlflow"
 *   fallback={<InstallMLFlowPrompt />}
 * >
 *   <MLFlowDataTable />
 * </PluginGate>
 *
 * // With loading and error states
 * <PluginGate
 *   pluginKey="slack"
 *   loading={<Spinner />}
 *   error={<ErrorMessage />}
 *   fallback={<InstallSlackPrompt />}
 * >
 *   <SlackNotifications />
 * </PluginGate>
 * ```
 */
export const PluginGate: React.FC<PluginGateProps> = ({
  pluginKey,
  children,
  fallback = null,
  loading: loadingContent = null,
  error: errorContent = null,
}) => {
  const { isInstalled, loading, error } = useIsPluginInstalled(pluginKey);

  // Show loading content while checking
  if (loading) {
    return <>{loadingContent}</>;
  }

  // Show error content if there was an error
  if (error) {
    return <>{errorContent}</>;
  }

  // Show children if plugin is installed, otherwise show fallback
  return <>{isInstalled ? children : fallback}</>;
};

export default PluginGate;
