/**
 * Responsive Design System
 * 
 * Breakpoints, typography scales, and touch-target constants for a mobile-first,
 * responsive fitness application.
 * 
 * Mobile-first approach:
 * - Default: Single column, full-width elements
 * - Exception: Two-column layout for small widgets (stats, checkboxes, quick actions)
 * - Always single column: Primary buttons, exercise names, navigation, forms, cards
 */

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const BREAKPOINTS = {
  mobile: 375,      // Mobile devices (minimum width)
  tablet: 768,      // Tablet devices
  desktop: 1024,    // Desktop devices
  wide: 1440,       // Wide desktop
};

// Breakpoint ranges for clarity
export const BREAKPOINT_RANGES = {
  mobile: { min: BREAKPOINTS.mobile, max: BREAKPOINTS.tablet - 1 },
  tablet: { min: BREAKPOINTS.tablet, max: BREAKPOINTS.desktop - 1 },
  desktop: { min: BREAKPOINTS.desktop, max: BREAKPOINTS.wide - 1 },
  wide: { min: BREAKPOINTS.wide },
};

// ============================================================================
// MEDIA QUERIES
// ============================================================================

/**
 * Media query helpers for use in styled components or inline styles
 */
export const mediaQueries = {
  // Mobile-first: min-width queries
  mobile: `@media (min-width: ${BREAKPOINTS.mobile}px)`,
  tablet: `@media (min-width: ${BREAKPOINTS.tablet}px)`,
  desktop: `@media (min-width: ${BREAKPOINTS.desktop}px)`,
  wide: `@media (min-width: ${BREAKPOINTS.wide}px)`,
  
  // Max-width queries for mobile-specific styles
  mobileOnly: `@media (max-width: ${BREAKPOINTS.tablet - 1}px)`,
  tabletOnly: `@media (min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`,
  desktopOnly: `@media (min-width: ${BREAKPOINTS.desktop}px)`,
};

/**
 * Helper function to check current breakpoint in JavaScript
 */
export const getCurrentBreakpoint = () => {
  const width = window.innerWidth;
  if (width >= BREAKPOINTS.wide) return 'wide';
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
};

/**
 * Hook-friendly breakpoint checker
 */
export const isMobile = () => window.innerWidth < BREAKPOINTS.tablet;
export const isTablet = () => window.innerWidth >= BREAKPOINTS.tablet && window.innerWidth < BREAKPOINTS.desktop;
export const isDesktop = () => window.innerWidth >= BREAKPOINTS.desktop;

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================

/**
 * Responsive typography scale
 * Uses fluid typography for smooth scaling between breakpoints
 */
export const typography = {
  // Display heading (Hero sections)
  display: {
    mobile: {
      fontSize: '2rem',      // 32px
      lineHeight: 1.2,
      fontWeight: 700,
    },
    tablet: {
      fontSize: '2.5rem',    // 40px
      lineHeight: 1.2,
      fontWeight: 700,
    },
    desktop: {
      fontSize: '3rem',      // 48px
      lineHeight: 1.1,
      fontWeight: 700,
    },
  },
  
  // H1 - Page titles
  h1: {
    mobile: {
      fontSize: '1.75rem',   // 28px
      lineHeight: 1.3,
      fontWeight: 700,
    },
    tablet: {
      fontSize: '2.125rem',  // 34px
      lineHeight: 1.3,
      fontWeight: 700,
    },
    desktop: {
      fontSize: '2.5rem',    // 40px
      lineHeight: 1.2,
      fontWeight: 700,
    },
  },
  
  // H2 - Section titles
  h2: {
    mobile: {
      fontSize: '1.5rem',    // 24px
      lineHeight: 1.3,
      fontWeight: 600,
    },
    tablet: {
      fontSize: '1.75rem',   // 28px
      lineHeight: 1.3,
      fontWeight: 600,
    },
    desktop: {
      fontSize: '2rem',      // 32px
      lineHeight: 1.3,
      fontWeight: 600,
    },
  },
  
  // H3 - Subsection titles
  h3: {
    mobile: {
      fontSize: '1.25rem',   // 20px
      lineHeight: 1.4,
      fontWeight: 600,
    },
    tablet: {
      fontSize: '1.5rem',    // 24px
      lineHeight: 1.4,
      fontWeight: 600,
    },
    desktop: {
      fontSize: '1.5rem',    // 24px
      lineHeight: 1.4,
      fontWeight: 600,
    },
  },
  
  // Body text
  body: {
    mobile: {
      fontSize: '1rem',      // 16px
      lineHeight: 1.5,
      fontWeight: 400,
    },
    tablet: {
      fontSize: '1rem',      // 16px
      lineHeight: 1.6,
      fontWeight: 400,
    },
    desktop: {
      fontSize: '1.125rem',  // 18px
      lineHeight: 1.6,
      fontWeight: 400,
    },
  },
  
  // Small text
  small: {
    mobile: {
      fontSize: '0.875rem',  // 14px
      lineHeight: 1.5,
      fontWeight: 400,
    },
    tablet: {
      fontSize: '0.875rem',  // 14px
      lineHeight: 1.5,
      fontWeight: 400,
    },
    desktop: {
      fontSize: '0.875rem',  // 14px
      lineHeight: 1.5,
      fontWeight: 400,
    },
  },
  
  // Button text
  button: {
    mobile: {
      fontSize: '1rem',      // 16px
      lineHeight: 1,
      fontWeight: 600,
      letterSpacing: '0.5px',
    },
    tablet: {
      fontSize: '1rem',      // 16px
      lineHeight: 1,
      fontWeight: 600,
      letterSpacing: '0.5px',
    },
    desktop: {
      fontSize: '1.125rem',  // 18px
      lineHeight: 1,
      fontWeight: 600,
      letterSpacing: '0.5px',
    },
  },
};

// ============================================================================
// TOUCH TARGETS & SPACING
// ============================================================================

/**
 * Touch-friendly target sizes
 * Following WCAG 2.1 Level AAA guidelines (44x44px minimum)
 */
export const touchTargets = {
  minimum: '44px',           // WCAG AAA minimum
  comfortable: '48px',       // More comfortable for mobile
  primary: '56px',           // Primary actions (CTAs)
  navigation: '56px',        // Bottom navigation bar height
};

/**
 * Spacing scale (in rem units for accessibility)
 */
export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  xxl: '3rem',      // 48px
};

/**
 * Container padding by breakpoint
 */
export const containerPadding = {
  mobile: '1rem',     // 16px
  tablet: '2rem',     // 32px
  desktop: '3rem',    // 48px
};

// ============================================================================
// LAYOUT UTILITIES
// ============================================================================

/**
 * Grid configurations for selective two-column layouts on mobile
 */
export const gridLayouts = {
  // Two-column grid for small widgets (stats, checkboxes, etc.)
  twoColumnMobile: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: spacing.md,
  },
  
  // Three-column for tablet
  threeColumnTablet: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: spacing.lg,
  },
  
  // Four-column for desktop
  fourColumnDesktop: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: spacing.xl,
  },
};

/**
 * Helper function to generate responsive padding
 */
export const getResponsivePadding = (multiplier = 1) => ({
  padding: `calc(${containerPadding.mobile} * ${multiplier})`,
  [mediaQueries.tablet]: {
    padding: `calc(${containerPadding.tablet} * ${multiplier})`,
  },
  [mediaQueries.desktop]: {
    padding: `calc(${containerPadding.desktop} * ${multiplier})`,
  },
});

/**
 * Helper to create responsive font size
 */
export const getResponsiveFontSize = (typeScale) => {
  const scale = typography[typeScale];
  if (!scale) return {};
  
  return {
    fontSize: scale.mobile.fontSize,
    lineHeight: scale.mobile.lineHeight,
    fontWeight: scale.mobile.fontWeight,
    [mediaQueries.tablet]: {
      fontSize: scale.tablet.fontSize,
      lineHeight: scale.tablet.lineHeight,
    },
    [mediaQueries.desktop]: {
      fontSize: scale.desktop.fontSize,
      lineHeight: scale.desktop.lineHeight,
    },
  };
};

// ============================================================================
// COMPONENT-SPECIFIC LAYOUTS
// ============================================================================

/**
 * Layout patterns for specific use cases
 */
export const layouts = {
  // Dashboard/Home screen layout
  dashboard: {
    mobile: {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.lg,
    },
    tablet: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: spacing.xl,
    },
    desktop: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: spacing.xxl,
    },
  },
  
  // Stat tiles (two-column on mobile)
  statTiles: {
    mobile: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: spacing.md,
    },
    tablet: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: spacing.lg,
    },
    desktop: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: spacing.xl,
    },
  },
  
  // Quick action buttons (two-column on mobile)
  quickActions: {
    mobile: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: spacing.sm,
    },
    tablet: {
      display: 'flex',
      flexDirection: 'row',
      gap: spacing.md,
    },
    desktop: {
      display: 'flex',
      flexDirection: 'row',
      gap: spacing.lg,
    },
  },
  
  // Calendar and session details (tablet/desktop)
  calendarWithDetails: {
    mobile: {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.lg,
    },
    tablet: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: spacing.xl,
    },
    desktop: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: spacing.xxl,
    },
  },
};

/**
 * Z-index scale for layering
 */
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  tooltip: 500,
  notification: 600,
  navigation: 1000,
};

// ============================================================================
// SAFE AREA INSETS (for iOS notch, etc.)
// ============================================================================

/**
 * Safe area padding for mobile devices with notches
 */
export const safeAreaPadding = {
  top: 'max(1rem, env(safe-area-inset-top))',
  right: 'max(1rem, env(safe-area-inset-right))',
  bottom: 'max(1rem, env(safe-area-inset-bottom))',
  left: 'max(1rem, env(safe-area-inset-left))',
};

export default {
  BREAKPOINTS,
  BREAKPOINT_RANGES,
  mediaQueries,
  typography,
  touchTargets,
  spacing,
  containerPadding,
  gridLayouts,
  layouts,
  zIndex,
  safeAreaPadding,
  getResponsivePadding,
  getResponsiveFontSize,
  getCurrentBreakpoint,
  isMobile,
  isTablet,
  isDesktop,
};
