// VerifyWise Brand Colors - Light Theme
export const colors = {
  primary: "#13715B",
  primaryLight: "#1a9e7a",
  primaryDark: "#0d5243",
  accent: "#3B82F6",
  white: "#ffffff",
  background: "#f8fafc",
  backgroundAlt: "#f1f5f9",
  dark: "#1f2937",
  darkAlt: "#374151",
  gray: "#6b7280",
  grayLight: "#9ca3af",
  border: "#e2e8f0",
};

// Typography - Using Inter font
export const typography = {
  fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  heading: {
    fontSize: 52,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
  },
  subheading: {
    fontSize: 28,
    fontWeight: 500,
    letterSpacing: "-0.01em",
  },
  body: {
    fontSize: 24,
    fontWeight: 400,
    lineHeight: 1.5,
  },
  feature: {
    fontSize: 20,
    fontWeight: 400,
    lineHeight: 1.6,
  },
};

// Light background styles
export const backgroundStyle = {
  background: `linear-gradient(135deg, ${colors.white} 0%, ${colors.background} 50%, ${colors.backgroundAlt} 100%)`,
  position: "absolute",
  width: "100%",
  height: "100%",
};

// Grid overlay - subtle for light theme
export const gridOverlay = {
  position: "absolute",
  width: "100%",
  height: "100%",
  backgroundImage: `
    linear-gradient(${colors.border}40 1px, transparent 1px),
    linear-gradient(90deg, ${colors.border}40 1px, transparent 1px)
  `,
  backgroundSize: "60px 60px",
};

// Screenshot 3D transform
export const getScreenshotTransform = (variant, frame) => {
  const rotateY = variant === "right" ? -8 : 8;
  const floatY = Math.sin(frame * 0.03) * 6;
  return `perspective(1200px) rotateY(${rotateY}deg) rotateX(3deg) rotateZ(${variant === "right" ? 0.5 : -0.5}deg) translateY(${floatY}px)`;
};

// Browser chrome styles - light theme
export const browserChrome = {
  background: "linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%)",
  borderRadius: "12px 12px 0 0",
  padding: "12px 16px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  borderBottom: `1px solid ${colors.border}`,
};

export const trafficLight = (color) => ({
  width: 12,
  height: 12,
  borderRadius: "50%",
  backgroundColor: color,
});

// Glowing dot bullet - using primary color
export const glowingDot = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: colors.primary,
  boxShadow: `0 0 8px ${colors.primary}80`,
  flexShrink: 0,
};

// Screenshot glow effect - lighter for light theme
export const screenshotGlow = {
  position: "absolute",
  width: "120%",
  height: "120%",
  top: "-10%",
  left: "-10%",
  background: `radial-gradient(ellipse at center, ${colors.primary}20 0%, transparent 70%)`,
  filter: "blur(40px)",
  zIndex: -1,
};

// Icon container style
export const iconContainer = {
  width: 48,
  height: 48,
  borderRadius: 12,
  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: `0 4px 20px ${colors.primary}40`,
};

// Bullet icon style
export const bulletIcon = {
  width: 20,
  height: 20,
  color: colors.primary,
  flexShrink: 0,
};
