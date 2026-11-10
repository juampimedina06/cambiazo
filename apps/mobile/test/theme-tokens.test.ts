import { describe, it, expect } from 'vitest';
import { colors } from '../src/shared/theme/colors';
import { typography } from '../src/shared/theme/typography';
import { layout } from '../src/shared/theme/layout';

describe('Design Tokens & Visual Rules (AGENTS.md)', () => {
  it('complies with 60-30-10 color proportions and required palette', () => {
    // 60% Canvas & Clean Surfaces
    expect(colors.background.canvas).toBe('#F8F7FF');
    expect(colors.background.surface).toBe('#FFFFFF');
    expect(colors.background.divider).toBe('#F1F5F9');

    // 30% Brand Purple
    expect(colors.brand.primary).toBe('#6C3CE9');
    expect(colors.brand.primaryDark).toBe('#4C1D95');
    expect(colors.brand.primarySoft).toBe('#EDE9FE');

    // 10% Accents (Separation of economies)
    expect(colors.economy.pointsYellow).toBe('#FACC15');
    expect(colors.economy.moneyMint).toBe('#10B981');

    // Text & Semantics
    expect(colors.text.primary).toBe('#1E1B4B');
    expect(colors.text.secondary).toBe('#64748B');
    expect(colors.status.warning).toBe('#F97316');
    expect(colors.status.danger).toBe('#EF4444');
  });

  it('enforces button ergonomics: min height >= 52px and rounded-2xl', () => {
    expect(layout.button.minHeight).toBeGreaterThanOrEqual(52);
    expect(layout.button.minHeight).toBeLessThanOrEqual(56);
    expect(layout.button.borderRadius).toBeGreaterThanOrEqual(16);
    expect(layout.button.borderRadius).toBeLessThanOrEqual(24);
  });

  it('enforces anti-saturation rules: no card nesting and max 3 data items', () => {
    expect(layout.rules.allowCardNesting).toBe(false);
    expect(layout.rules.maxStudentListItemDataPoints).toBe(3);
  });

  it('includes tabular-friendly balance typography size', () => {
    expect(typography.size.balance).toBeGreaterThanOrEqual(38);
    expect(typography.size.balance).toBeLessThanOrEqual(44);
  });
});
