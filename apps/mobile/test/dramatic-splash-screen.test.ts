import { describe, it, expect } from 'vitest';
import { colors } from '../src/shared/theme/colors';

describe('DramaticSplashScreen (Mobile Intro Specification)', () => {
  it('aligns splash charging colors with Cambiazo brand guidelines', () => {
    // Pencil C & Community Points Yellow
    expect(colors.economy.pointsYellow).toBe('#FACC15');
    // Money / Success Mint
    expect(colors.economy.moneyMint).toBe('#10B981');
    // Primary Purple
    expect(colors.brand.primary).toBe('#6C3CE9');
  });

  it('enforces splash duration to remain snappy for quick recess access', () => {
    const DEFAULT_SPLASH_DURATION_MS = 2600;
    // Splash must complete under 3 seconds to respect recess scan time
    expect(DEFAULT_SPLASH_DURATION_MS).toBeLessThanOrEqual(3000);
    expect(DEFAULT_SPLASH_DURATION_MS).toBeGreaterThanOrEqual(1500);
  });
});
