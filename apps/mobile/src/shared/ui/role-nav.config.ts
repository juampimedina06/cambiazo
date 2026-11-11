export type RoleNavIconKey =
  | 'home'
  | 'qr'
  | 'savings'
  | 'community'
  | 'wallet'
  | 'limits'
  | 'summary'
  | 'notifications';

export interface RoleNavItem {
  key: string;
  label: string;
  href: string;
  matchRoute: string;
  matchPrefixes?: readonly string[];
  icon: RoleNavIconKey;
  testID: string;
}

export const STUDENT_NAV_ITEMS: readonly RoleNavItem[] = [
  {
    key: 'student-home',
    label: 'Inicio',
    href: '/(student)',
    matchRoute: '/',
    icon: 'home',
    testID: 'nav-student-home',
  },
  {
    key: 'student-pay-qr',
    label: 'Pagar QR',
    href: '/(student)/pay-qr',
    matchRoute: '/pay-qr',
    matchPrefixes: ['/pay-qr'],
    icon: 'qr',
    testID: 'nav-student-pay-qr',
  },
  {
    key: 'student-savings',
    label: 'Metas',
    href: '/(student)/wallet/savings-goals',
    matchRoute: '/wallet/savings-goals',
    matchPrefixes: ['/wallet'],
    icon: 'savings',
    testID: 'nav-student-savings',
  },
  {
    key: 'student-community',
    label: 'Comunidad',
    href: '/(student)/community',
    matchRoute: '/community',
    matchPrefixes: ['/community'],
    icon: 'community',
    testID: 'nav-student-community',
  },
] as const;

export const PARENT_NAV_ITEMS: readonly RoleNavItem[] = [
  {
    key: 'parent-home',
    label: 'Inicio',
    href: '/(parent)',
    matchRoute: '/',
    icon: 'home',
    testID: 'nav-parent-home',
  },
  {
    key: 'parent-topup',
    label: 'Cargar',
    href: '/(parent)/wallet/top-up',
    matchRoute: '/wallet/top-up',
    matchPrefixes: ['/wallet'],
    icon: 'wallet',
    testID: 'nav-parent-topup',
  },
  {
    key: 'parent-limits',
    label: 'Controles',
    href: '/(parent)/controls/spending-limits',
    matchRoute: '/controls/spending-limits',
    matchPrefixes: ['/controls'],
    icon: 'limits',
    testID: 'nav-parent-limits',
  },
  {
    key: 'parent-summary',
    label: 'Resumen',
    href: '/(parent)/reports/weekly-summary',
    matchRoute: '/reports/weekly-summary',
    matchPrefixes: ['/reports'],
    icon: 'summary',
    testID: 'nav-parent-summary',
  },
  {
    key: 'parent-notifications',
    label: 'Alertas',
    href: '/(parent)/notifications',
    matchRoute: '/notifications',
    matchPrefixes: ['/notifications'],
    icon: 'notifications',
    testID: 'nav-parent-notifications',
  },
] as const;

export const STUDENT_HIDDEN_NAV_ROUTES: readonly string[] = [
  '/blocked',
  '/community/camera',
] as const;

export function pathFromSegments(segments?: readonly string[] | null): string {
  if (!segments || segments.length === 0) {
    return '/';
  }
  const clean = segments.filter((segment) => segment && !segment.startsWith('('));
  if (clean.length === 0) {
    return '/';
  }
  return normalizeRoutePath(`/${clean.join('/')}`);
}

export function normalizeRoutePath(pathname?: string | null): string {
  if (!pathname || pathname === '/index') {
    return '/';
  }
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return trimmed === '/index' ? '/' : trimmed || '/';
}

export function isNavItemActive(
  pathname: string | null | undefined,
  item: Pick<RoleNavItem, 'matchRoute' | 'matchPrefixes'>,
): boolean {
  const current = normalizeRoutePath(pathname);

  if (item.matchRoute === '/') {
    return current === '/';
  }

  if (current === item.matchRoute) {
    return true;
  }

  if (!item.matchPrefixes || item.matchPrefixes.length === 0) {
    return false;
  }

  return item.matchPrefixes.some(
    (prefix) => current === prefix || current.startsWith(`${prefix}/`),
  );
}

export function shouldHideRoleNav(
  pathname: string | null | undefined,
  hiddenRoutes: readonly string[] = [],
): boolean {
  const current = normalizeRoutePath(pathname);
  return hiddenRoutes.some(
    (route) => current === route || current.startsWith(`${route}/`),
  );
}
