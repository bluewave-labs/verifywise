import React from 'react';
import { Button, Box, Typography, SvgIcon } from '@mui/material';

// Microsoft logo SVG component
const MicrosoftIcon = () => (
  <SvgIcon viewBox="0 0 23 23" sx={{ width: 18, height: 18 }}>
    <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
    <rect x="12" y="1" width="10" height="10" fill="#00a4ef"/>
    <rect x="1" y="12" width="10" height="10" fill="#7fba00"/>
    <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
  </SvgIcon>
);

// Google logo SVG component (for future use)
const GoogleIcon = () => (
  <SvgIcon viewBox="0 0 24 24" sx={{ width: 18, height: 18 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </SvgIcon>
);

interface SSOButtonProps {
  provider: 'microsoft' | 'google';
  onClick: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
}

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