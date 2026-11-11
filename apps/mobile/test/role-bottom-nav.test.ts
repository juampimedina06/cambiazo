import { describe, it, expect } from 'vitest';
import {
  PARENT_NAV_ITEMS,
  STUDENT_HIDDEN_NAV_ROUTES,
  STUDENT_NAV_ITEMS,
  isNavItemActive,
  normalizeRoutePath,
  pathFromSegments,
  shouldHideRoleNav,
} from '../src/shared/ui/role-nav.config';

describe('RoleBottomNav configuration and active route matching', () => {
  it('defines the 4 student sections with matching icons and routes', () => {
    expect(STUDENT_NAV_ITEMS.map((item) => item.label)).toEqual([
      'Inicio',
      'Pagar QR',
      'Metas',
      'Comunidad',
    ]);
    expect(STUDENT_NAV_ITEMS.map((item) => item.icon)).toEqual([
      'home',
      'qr',
      'savings',
      'community',
    ]);
    expect(STUDENT_NAV_ITEMS.map((item) => item.href)).toEqual([
      '/(student)',
      '/(student)/pay-qr',
      '/(student)/wallet/savings-goals',
      '/(student)/community',
    ]);
  });

  it('defines the 5 parent sections with matching icons and routes', () => {
    expect(PARENT_NAV_ITEMS.map((item) => item.label)).toEqual([
      'Inicio',
      'Cargar',
      'Controles',
      'Resumen',
      'Alertas',
    ]);
    expect(PARENT_NAV_ITEMS.map((item) => item.icon)).toEqual([
      'home',
      'wallet',
      'limits',
      'summary',
      'notifications',
    ]);
    expect(PARENT_NAV_ITEMS.map((item) => item.href)).toEqual([
      '/(parent)',
      '/(parent)/wallet/top-up',
      '/(parent)/controls/spending-limits',
      '/(parent)/reports/weekly-summary',
      '/(parent)/notifications',
    ]);
  });

  it('normalizes root, route-group segments, and trailing slashes accurately', () => {
    expect(normalizeRoutePath(undefined)).toBe('/');
    expect(normalizeRoutePath('/index')).toBe('/');
    expect(normalizeRoutePath('/community/')).toBe('/community');
    expect(pathFromSegments(['(student)'])).toBe('/');
    expect(pathFromSegments(['(student)', 'index'])).toBe('/');
    expect(pathFromSegments(['(student)', 'community', 'rewards'])).toBe('/community/rewards');
    expect(pathFromSegments(['(parent)', 'controls', 'spending-limits'])).toBe('/controls/spending-limits');
  });

  it('activates only the matching tab, including nested community sub-screens', () => {
    const home = STUDENT_NAV_ITEMS[0]!;
    const payQr = STUDENT_NAV_ITEMS[1]!;
    const savings = STUDENT_NAV_ITEMS[2]!;
    const community = STUDENT_NAV_ITEMS[3]!;

    expect(isNavItemActive('/', home)).toBe(true);
    expect(isNavItemActive('/community', home)).toBe(false);
    expect(isNavItemActive('/pay-qr', payQr)).toBe(true);
    expect(isNavItemActive('/wallet/savings-goals', savings)).toBe(true);

    // Sub-screens under /community keep Comunidad highlighted
    expect(isNavItemActive('/community', community)).toBe(true);
    expect(isNavItemActive('/community/create', community)).toBe(true);
    expect(isNavItemActive('/community/leaderboard', community)).toBe(true);
    expect(isNavItemActive('/community/rewards', community)).toBe(true);
  });

  it('hides the student bottom bar on the consent blocked route', () => {
    expect(shouldHideRoleNav('/blocked', STUDENT_HIDDEN_NAV_ROUTES)).toBe(true);
    expect(shouldHideRoleNav('/pay-qr', STUDENT_HIDDEN_NAV_ROUTES)).toBe(false);
  });
});
