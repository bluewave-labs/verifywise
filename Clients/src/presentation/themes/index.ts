/**
 * Central export for all theme-related utilities
 * Import from this file to access standardized styles across the application
 */

export { default as light } from './light';
export { default as dark } from './dark';
export { default as singleTheme } from './v1SingleTheme';

export { alertStyles, getAlertStyles } from './alerts';
export { tableStyles, getTableStyles } from './tables';
export { getSingleTheme } from './v1SingleTheme';

export * from './mixins';
export * from './components';

// Re-export theme types for convenience
export type { Theme } from '@mui/material/styles';
export type { SxProps } from '@mui/material';
export type { ChartPalette } from '@mui/material/styles';