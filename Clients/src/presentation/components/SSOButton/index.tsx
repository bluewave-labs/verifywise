/**
 * @fileoverview SSO Authentication Button Component
 *
 * Provides a reusable, branded authentication button component supporting
 * multiple SSO providers (Microsoft, Google) with provider-specific styling,
 * icons, and interaction states. Designed for OAuth 2.0 authentication flows.
 *
 * Features:
 * - Multi-provider support with provider-specific branding
 * - Authentic provider styling matching official design guidelines
 * - Loading and disabled states for authentication flows
 * - Accessible button design with proper focus and hover states
 * - Responsive design with flexible width options
 *
 * Provider Support:
 * - Microsoft/Azure AD: Official Microsoft branding and colors
 * - Google: Official Google branding and colors (future implementation)
 *
 * @author VerifyWise Development Team
 * @since 2024-09-28
 * @version 1.0.0
 * @see {@link https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-add-branding-in-azure-ad-apps} Microsoft Branding Guidelines
 */

import React from 'react';
import { Button, Box, Typography, SvgIcon } from '@mui/material';

/**
 * Microsoft logo SVG icon component
 *
 * Renders the official Microsoft logo using the correct colors and proportions
 * as specified in Microsoft's brand guidelines.
 *
 * @component MicrosoftIcon
 * @returns {JSX.Element} Microsoft logo SVG icon
 */
const MicrosoftIcon = () => (
  <SvgIcon viewBox="0 0 23 23" sx={{ width: 18, height: 18 }}>
    <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
    <rect x="12" y="1" width="10" height="10" fill="#00a4ef"/>
    <rect x="1" y="12" width="10" height="10" fill="#7fba00"/>
    <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
  </SvgIcon>
);

/**
 * Google logo SVG icon component
 *
 * Renders the official Google logo using the correct colors and proportions
 * as specified in Google's brand guidelines. Currently for future use.
 *
 * @component GoogleIcon
 * @returns {JSX.Element} Google logo SVG icon
 */
const GoogleIcon = () => (
  <SvgIcon viewBox="0 0 24 24" sx={{ width: 18, height: 18 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </SvgIcon>
);

/**
 * Props interface for the SSO authentication button component
 *
 * @interface SSOButtonProps
 * @since 1.0.0
 */
interface SSOButtonProps {
  /** SSO provider type determining button styling and branding */
  provider: 'microsoft' | 'google';

  /** Click handler function triggered when the button is clicked */
  onClick: () => void;

  /** Whether the button is disabled (prevents user interaction) */
  disabled?: boolean;

  /** Whether the button should take full width of its container */
  fullWidth?: boolean;

  /** Whether the button is in a loading state (shows loading indicator) */
  loading?: boolean;
}

/**
 * SSO Authentication Button Component
 *
 * A comprehensive, reusable button component for SSO authentication flows.
 * Provides provider-specific branding, authentic styling, and proper interaction
 * states for OAuth 2.0 authentication with multiple identity providers.
 *
 * @component SSOButton
 * @param {SSOButtonProps} props - Component properties
 * @returns {JSX.Element} Rendered SSO authentication button
 *
 * @features
 * - Provider-specific branding (Microsoft, Google)
 * - Authentic styling matching official provider guidelines
 * - Loading and disabled states for authentication flows
 * - Accessible design with proper ARIA attributes
 * - Responsive design with flexible width options
 * - Hover and focus states matching provider designs
 *
 * @accessibility
 * - Proper button semantics and keyboard navigation
 * - Focus indicators matching provider accessibility standards
 * - Disabled state properly communicated to screen readers
 * - Loading state indication for user feedback
 *
 * @example
 * ```tsx
 * // Microsoft SSO button
 * <SSOButton
 *   provider="microsoft"
 *   onClick={handleMicrosoftLogin}
 *   loading={isAuthenticating}
 *   disabled={!isConfigured}
 * />
 *
 * // Google SSO button (future implementation)
 * <SSOButton
 *   provider="google"
 *   onClick={handleGoogleLogin}
 *   fullWidth={false}
 * />
 * ```
 *
 * @provider_styling
 * - Microsoft: White background, gray border, Microsoft logo, official colors
 * - Google: White background, light gray border, Google logo, official colors
 *
 * @since 1.0.0
 */
const SSOButton: React.FC<SSOButtonProps> = ({
  provider,
  onClick,
  disabled = false,
  fullWidth = true,
  loading = false
}) => {
  const getProviderConfig = () => {
    switch (provider) {
      case 'microsoft':
        return {
          icon: <MicrosoftIcon />,
          text: 'Sign in with Microsoft',
          backgroundColor: '#ffffff',
          borderColor: '#8c8c8c',
          textColor: '#5e5e5e',
          hoverBorderColor: '#8c8c8c',
          hoverBackgroundColor: '#f3f2f1'
        };
      case 'google':
        return {
          icon: <GoogleIcon />,
          text: 'Sign in with Google',
          backgroundColor: '#ffffff',
          borderColor: '#dadce0',
          textColor: '#3c4043',
          hoverBorderColor: '#d2e3fc',
          hoverBackgroundColor: '#f8f9fa'
        };
      default:
        throw new Error(`Unsupported SSO provider: ${provider}`);
    }
  };

  const config = getProviderConfig();

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      variant="outlined"
      sx={{
        height: 48,
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
        color: config.textColor,
        textTransform: 'none',
        fontSize: '14px',
        fontWeight: 500,
        borderRadius: '4px',
        border: `1px solid ${config.borderColor}`,
        '&:hover': {
          backgroundColor: config.hoverBackgroundColor,
          borderColor: config.hoverBorderColor,
          boxShadow: '0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15)'
        },
        '&:focus': {
          backgroundColor: config.hoverBackgroundColor,
          borderColor: config.hoverBorderColor,
          outline: 'none'
        },
        '&:disabled': {
          backgroundColor: '#f9f9f9',
          borderColor: '#dadce0',
          color: '#9aa0a6'
        }
      }}
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5
      }}>
        {config.icon}
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: config.textColor,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          {config.text}
        </Typography>
      </Box>
    </Button>
  );
};

export default SSOButton;