/**
 * Layout and ergonomics tokens according to AGENTS.md
 * - Buttons must have minimum height of 52px - 56px (target: 54px)
 * - Rounded-2xl radius (16px - 24px)
 * - NO CARD-IN-CARD rule: surfaces are flat or dividers
 * - Max 3 data items per item in student views
 */

export const layout = {
  button: {
    minHeight: 54,     // 52px - 56px for touch without precision in school recess
    borderRadius: 20,  // rounded-2xl
  },
  surface: {
    borderRadius: 20,
    padding: 18,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  // Rule anti-saturation helpers
  rules: {
    allowCardNesting: false,
    maxStudentListItemDataPoints: 3,
  },
} as const;

export type Layout = typeof layout;
