import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { trackReactError } from '../../../application/utils/error-tracking';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches React errors and tracks them with PostHog
 * Provides a fallback UI when errors occur
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Track the error to PostHog
    trackReactError(
      error,
      { componentStack: errorInfo.componentStack || '' },
      {
        component_stack: errorInfo.componentStack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }
    );

    // Store error info in state for display
    this.setState({
      errorInfo,
    });

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Reload the page to reset the app state
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 4,
            backgroundColor: '#f5f5f5',
          }}
        >
          <Stack
            spacing={3}
            sx={{
              maxWidth: 600,
              width: '100%',
              padding: 4,
              backgroundColor: 'white',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <Typography variant="h4" component="h1" color="error">
              Something went wrong
            </Typography>

            <Typography variant="body1" color="text.secondary">
              We're sorry, but something unexpected happened. The error has been
              logged and we'll look into it.
            </Typography>

            {this.props.showDetails && import.meta.env.DEV && this.state.error && (
              <Box
                sx={{
                  padding: 2,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: 300,
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.error.stack}
                </Typography>
              </Box>
            )}

            <Button
              variant="contained"
              onClick={this.handleReset}
              sx={{ alignSelf: 'flex-start' }}
            >
              Reload Page
            </Button>
          </Stack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
