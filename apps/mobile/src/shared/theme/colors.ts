/**
 * Color system tokens according to AGENTS.md and ARCHITECTURE.md
 * 60-30-10 Proportion:
 * - 60% Canvas & Clean Surfaces: #F8F7FF (canvas), #FFFFFF (surface), #F1F5F9 (divider)
 * - 30% Brand Purple: #6C3CE9 (primary), #4C1D95 (primaryDark), #EDE9FE (primarySoft)
 * - 10% Accents: #FACC15 (points yellow), #10B981 (money mint)
 */

export const colors = {
  background: {
    canvas: '#F8F7FF',
    surface: '#FFFFFF',
    divider: '#F1F5F9',
  },
  brand: {
    primary: '#6C3CE9',
    primaryDark: '#4C1D95',
    primarySoft: '#EDE9FE',
  },
  economy: {
    pointsYellow: '#FACC15',
    pointsYellowDark: '#B45309',
    pointsYellowSoft: '#FEF9C3',
    moneyMint: '#10B981',
    moneyMintDark: '#047857',
    moneyMintSoft: '#D1FAE5',
  },
  text: {
    primary: '#1E1B4B',
    secondary: '#64748B',
    inverse: '#FFFFFF',
    muted: '#94A3B8',
  },
  status: {
    warning: '#F97316',
    danger: '#EF4444',
    success: '#10B981',
    info: '#3B82F6',
  },
} as const;

export type Colors = typeof colors;
