import { describe, it, expect } from 'vitest';
import { cambiazzoColors } from '../src/shared/theme/colors';

describe('Design Tokens & Palette Compliance (AGENTS.md & ARCHITECTURE.md)', () => {
  it('should strictly define the 60-30-10 color palette tokens', () => {
    // 60% Clean Backgrounds
    expect(cambiazzoColors.background.canvas).toBe('#F8F7FF');
    expect(cambiazzoColors.background.surface).toBe('#FFFFFF');

    // 30% Brand Purple
    expect(cambiazzoColors.brand.primary).toBe('#6C3CE9');
    expect(cambiazzoColors.brand.primaryDark).toBe('#4C1D95');
    expect(cambiazzoColors.brand.primarySoft).toBe('#EDE9FE');

    // 10% Accents (Two Separated Economies)
    expect(cambiazzoColors.economy.pointsYellow).toBe('#FACC15');
    expect(cambiazzoColors.economy.moneyMint).toBe('#10B981');

    // High Contrast Typography
    expect(cambiazzoColors.text.primary).toBe('#1E1B4B');
    expect(cambiazzoColors.text.secondary).toBe('#64748B');
  });

  it('should adhere to the immutable naming rules (no crypto or tokens)', () => {
    // Verify that monetary tokens are named ARS or Pesos, never 'coins' or 'crypto'
    expect(cambiazzoColors.economy).toHaveProperty('moneyMint');
    expect(cambiazzoColors.economy).toHaveProperty('pointsYellow');
    expect(cambiazzoColors.economy).not.toHaveProperty('crypto');
    expect(cambiazzoColors.economy).not.toHaveProperty('coins');
  });
});
