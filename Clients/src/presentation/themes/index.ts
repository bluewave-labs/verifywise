/**
 * Central export for all theme-related utilities
 * Import from this file to access standardized styles across the application
 */

export { default as light } from './light';
export { default as dark } from './dark';
export { default as singleTheme } from './v1SingleTheme';

export { alertStyles } from './alerts';
export { tableStyles } from './tables';

export * from './mixins';
export * from './components';

// Re-export theme types for convenience
export type { Theme } from '@mui/material/styles';
export type { SxProps } from '@mui/material';