import { styled, Theme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

interface ContainerProps {
  theme?: Theme; // Theme is automatically injected
}

export const Container = styled(Box)<ContainerProps>(() => ({
  width: '100%',
  backgroundColor: '#CBF5E5',
  borderRadius: '4px',
  textAlign: 'center',
  alignContent: 'center',
  padding: '6px 12px',
  position: 'relative',
  top: '-15px',
  role: 'alert',
  ariaLive: 'polite',
}));

export const Text = styled(Typography)(() => ({
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  fontSize: '13px',
  lineHeight: '20px',
  letterSpacing: '-0.6%',
  color: '#176448',
}));