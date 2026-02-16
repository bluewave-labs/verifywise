/**
 * Centralized Design Tokens (Single Source of Truth)
 * Use these constants throughout the app for consistent styling.
 * CSS-only items (font-faces, resets) are in globals.css
 */

// Colors - Text (using CSS custom properties for theme support)
export const colors = {
  text: {
    primary: 'var(--vw-text-primary, #1a1a1a)',
    secondary: 'var(--vw-text-secondary, #374151)',
    muted: 'var(--vw-text-muted, #6b7280)',
    white: '#ffffff',
    whiteMuted: 'rgba(255, 255, 255, 0.8)',
  },
  brand: {
    primary: 'var(--vw-primary, #13715B)',
    primaryDark: 'var(--vw-primary-hover, #0A4A3A)',
    success: '#17B26A',
    warning: '#F79009',
    error: '#F04438',
  },
  border: {
    default: 'var(--vw-border-dark, #d0d5dd)',
  },
  background: {
    white: 'var(--vw-bg-main, #ffffff)',
    alt: 'var(--vw-bg-accent, #f9fafb)',
    code: '#1C2130',
  },
} as const;

// Typography
export const typography = {
  fontFamily: {
    sans: "'Geist', system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif",
    mono: "'Geist Mono', 'Fira Code', 'Consolas', monospace",
  },
  fontSize: {
    xs: 12,
    sm: 12,
    base: 13,
    md: 14,
    lg: 15,
    xl: 16,
    '2xl': 20,
    '3xl': 22,
    '4xl': 26,
    '5xl': 30,
  },
  lineHeight: {
    tight: 1.2,
    snug: 1.3,
    normal: 1.4,
    relaxed: 1.5,
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

// Spacing
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
  '4xl': '48px',
} as const;

// Border
export const border = {
  radius: '4px',
  default: `1px solid var(--vw-border-dark, #d0d5dd)`,
} as const;

// Image styles
export const imageStyles = {
  image: {
    width: '100%',
    borderRadius: border.radius,
    border: border.default,
    display: 'block' as const,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  caption: {
    fontSize: 10,
    color: colors.text.muted,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
} as const;

// Inline code chip styles
export const chipStyles = {
  // URL chips (light green)
  url: {
    backgroundColor: '#e6f4ea',
    color: '#1e7e34',
    padding: '2px 8px',
    borderRadius: '4px',
    fontFamily: typography.fontFamily.mono,
    fontSize: '0.9em',
  },
  // File/code chips (light gray)
  code: {
    backgroundColor: 'var(--vw-bg-subtle, #f1f3f4)',
    color: 'var(--vw-text-tertiary, #5f6368)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontFamily: typography.fontFamily.mono,
    fontSize: '0.9em',
  },
} as const;

// Common component styles
export const componentStyles = {
  // Card styles
  card: {
    backgroundColor: colors.background.white,
    border: border.default,
    borderRadius: border.radius,
  },
  // Heading styles
  heading: {
    h2: {
      fontFamily: typography.fontFamily.sans,
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      lineHeight: typography.lineHeight.normal,
    },
    h3: {
      fontFamily: typography.fontFamily.sans,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      lineHeight: typography.lineHeight.normal,
    },
  },
  // Paragraph styles
  paragraph: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.relaxed,
  },
  // List item styles
  listItem: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.snug,
  },
} as const;

// Export everything as a single theme object
export const theme = {
  colors,
  typography,
  spacing,
  border,
  imageStyles,
  chipStyles,
  componentStyles,
} as const;

export default theme;
