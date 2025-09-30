/**
 * @fileoverview Entra ID Configuration Page Wrapper
 *
 * This component serves as the main wrapper and layout container for the
 * Azure AD (Entra ID) Single Sign-On configuration interface. It provides
 * responsive layout styling and organizes the SSO configuration components
 * within the settings page structure.
 *
 * Features:
 * - Responsive layout design with mobile and desktop breakpoints
 * - Consistent spacing and positioning within the settings page
 * - Clean container structure for SSO configuration components
 * - Integration with the broader settings page navigation
 *
 * @author VerifyWise Development Team
 * @since 2024-09-28
 * @version 1.0.0
 */

import React from "react";
import { Box } from "@mui/material";
import SsoConfigTab from "./SsoConfigTab";

/**
 * Entra ID Configuration Page Component
 *
 * Main wrapper component for the Azure AD SSO configuration interface.
 * Provides responsive layout and serves as the entry point for SSO
 * configuration management within the settings page.
 *
 * @component EntraIdConfig
 * @returns {JSX.Element} The Entra ID configuration page wrapper
 *
 * @layout
 * - Responsive width: 90% on mobile (xs), 70% on desktop (md+)
 * - Top margin for proper spacing within settings page
 * - Relative positioning for internal component layout
 *
 * @structure
 * - Contains SsoConfigTab component with all SSO configuration logic
 * - Provides consistent styling matching other settings page sections
 * - Maintains responsive design principles across screen sizes
 *
 * @example
 * ```tsx
 * // Usage within settings page routing
 * <Route path="/settings/entra-id" component={EntraIdConfig} />
 *
 * // Direct usage in settings layout
 * <EntraIdConfig />
 * ```
 *
 * @responsive_behavior
 * - Mobile (xs): 90% width for touch-friendly interface
 * - Desktop (md+): 70% width for optimal reading and form interaction
 * - Maintains consistent spacing with other settings page sections
 *
 * @since 1.0.0
 */
const EntraIdConfig: React.FC = () => {
  return (
    <Box sx={{
      position: "relative",
      mt: 3,
      width: { xs: "90%", md: "70%" },
    }}>
      <SsoConfigTab />
    </Box>
  );
};

export default EntraIdConfig;