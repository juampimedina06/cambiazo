import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  House,
  QrCode,
  PiggyBank,
  Sparkles,
  Wallet,
  SlidersHorizontal,
  BarChart3,
  Bell,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import {
  isNavItemActive,
  normalizeRoutePath,
  shouldHideRoleNav,
  type RoleNavIconKey,
  type RoleNavItem,
} from './role-nav.config';

export interface RoleBottomNavProps {
  items: readonly RoleNavItem[];
  activePath: string;
  hiddenRoutes?: readonly string[];
  onNavigate: (href: string) => void;
  testID?: string;
}

const renderNavIcon = (
  icon: RoleNavIconKey,
  color: string,
  size: number,
  strokeWidth: number,
) => {
  switch (icon) {
    case 'home':
      return <House size={size} color={color} strokeWidth={strokeWidth} />;
    case 'qr':
      return <QrCode size={size} color={color} strokeWidth={strokeWidth} />;
    case 'savings':
      return <PiggyBank size={size} color={color} strokeWidth={strokeWidth} />;
    case 'community':
      return <Sparkles size={size} color={color} strokeWidth={strokeWidth} />;
    case 'wallet':
      return <Wallet size={size} color={color} strokeWidth={strokeWidth} />;
    case 'limits':
      return <SlidersHorizontal size={size} color={color} strokeWidth={strokeWidth} />;
    case 'summary':
      return <BarChart3 size={size} color={color} strokeWidth={strokeWidth} />;
    case 'notifications':
      return <Bell size={size} color={color} strokeWidth={strokeWidth} />;
  }
};

/**
 * Persistent bottom navigation bar shared by Student and Parent role layouts.
 * Follows AGENTS.md 60-30-10 visual rules and >=52px touch targets.
 */
export const RoleBottomNav: React.FC<RoleBottomNavProps> = ({
  items,
  activePath,
  hiddenRoutes,
  onNavigate,
  testID,
}) => {
  if (shouldHideRoleNav(activePath, hiddenRoutes)) {
    return null;
  }

  const normalizedCurrent = normalizeRoutePath(activePath);

  return (
    <View style={styles.bar} testID={testID}>
      {items.map((item) => {
        const active = isNavItemActive(normalizedCurrent, item);
        const iconColor = active ? colors.brand.primary : colors.text.secondary;

        return (
          <TouchableOpacity
            key={item.key}
            style={styles.itemButton}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
            testID={item.testID}
            onPress={() => {
              if (normalizedCurrent !== item.matchRoute) {
                onNavigate(item.href);
              }
            }}
          >
            <View style={[styles.iconPill, active && styles.iconPillActive]}>
              {renderNavIcon(item.icon, iconColor, 20, active ? 2.3 : 1.9)}
            </View>
            <Text
              style={[styles.label, active && styles.labelActive]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: colors.background.divider,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 6,
  },
  itemButton: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  iconPill: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: colors.brand.primarySoft,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  labelActive: {
    fontWeight: '700',
    color: colors.brand.primaryDark,
  },
});
