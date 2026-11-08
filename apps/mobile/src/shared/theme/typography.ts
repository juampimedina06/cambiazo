/**
 * Typography scale according to AGENTS.md and ARCHITECTURE.md
 * Geometric and rounded font feel (Plus Jakarta Sans / Nunito / Inter)
 */

export const typography = {
  family: {
    heading: 'Plus Jakarta Sans',
    body: 'Inter',
  },
  size: {
    balance: 40,      // 38px - 44px for student wallet balance in pesos
    titleLg: 24,
    titleMd: 20,      // Standard section titles
    subtitle: 16,     // Body / card titles
    body: 15,
    caption: 13,
    legal: 12,        // Small legal disclaimers
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
} as const;

export type Typography = typeof typography;
