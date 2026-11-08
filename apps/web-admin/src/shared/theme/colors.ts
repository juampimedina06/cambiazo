/**
 * Official Cambiazo Design System Color Palette (AGENTS.md & ARCHITECTURE.md)
 * 60-30-10 Proportion:
 * - 60% Clean Backgrounds (#F8F7FF base canvas, #FFFFFF pure surface)
 * - 30% Brand Purple (#6C3CE9 primary, #4C1D95 dark, #EDE9FE soft)
 * - 10% Accents:
 *     - Points / Community Yellow (#FACC15)
 *     - Real Money Pesos Mint (#10B981)
 */
export const cambiazzoColors = {
  background: {
    canvas: '#F8F7FF',
    surface: '#FFFFFF',
    subtle: '#F1F5F9',
  },
  brand: {
    primary: '#6C3CE9',
    primaryDark: '#4C1D95',
    primarySoft: '#EDE9FE',
  },
  economy: {
    pointsYellow: '#FACC15',
    pointsYellowDark: '#B45309',
    moneyMint: '#10B981',
    moneyMintDark: '#047857',
  },
  text: {
    primary: '#1E1B4B',
    secondary: '#64748B',
    muted: '#94A3B8',
  },
  status: {
    warning: '#F97316',
    danger: '#EF4444',
    success: '#10B981',
    info: '#3B82F6',
  },
  border: {
    subtle: '#F1F5F9',
    default: '#E2E8F0',
    focus: '#6C3CE9',
  },
} as const;

export type CambiazoColors = typeof cambiazzoColors;
