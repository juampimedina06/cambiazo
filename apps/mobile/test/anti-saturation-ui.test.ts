import { describe, it, expect } from 'vitest';
import { colors } from '../src/shared/theme/colors';
import { layout } from '../src/shared/theme/layout';

describe('Anti-Saturation & Economy Separation Rules (AGENTS.md)', () => {
  it('strictly forbids nesting cards within cards', () => {
    expect(layout.rules.allowCardNesting).toBe(false);
  });

  it('limits student list items to at most 3 data points', () => {
    // 1. Icon/avatar, 2. Short title, 3. Highlighted right value
    expect(layout.rules.maxStudentListItemDataPoints).toBe(3);
  });

  it('maintains distinct colors for Financial Economy ($ Pesos) vs Community Economy (Points)', () => {
    // Pesos: Green Mint #10B981 & Primary Purple #6C3CE9
    expect(colors.economy.moneyMint).toBe('#10B981');
    expect(colors.brand.primary).toBe('#6C3CE9');

    // Community Points: Yellow #FACC15
    expect(colors.economy.pointsYellow).toBe('#FACC15');
    expect(colors.economy.pointsYellowDark).toBe('#B45309');

    // Make sure they are not the same color
    expect(colors.economy.moneyMint).not.toBe(colors.economy.pointsYellow);
  });

  it('ensures touch targets for recess queue are at least 52px high with rounded-2xl radii', () => {
    expect(layout.button.minHeight).toBeGreaterThanOrEqual(52);
    expect(layout.button.borderRadius).toBeGreaterThanOrEqual(16);
  });
});
