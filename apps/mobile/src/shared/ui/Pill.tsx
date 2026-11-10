import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';

export type PillVariant = 'points' | 'primary' | 'mint' | 'warning' | 'danger' | 'neutral';

export interface PillProps {
  label: string;
  variant?: PillVariant;
  icon?: string;
  style?: ViewStyle;
  testID?: string;
}

const variantTextStyles: Record<PillVariant, TextStyle> = {
  points: { color: colors.economy.pointsYellowDark },
  primary: { color: colors.brand.primaryDark },
  mint: { color: colors.economy.moneyMintDark },
  warning: { color: '#C2410C' },
  danger: { color: colors.status.danger },
  neutral: { color: colors.text.secondary },
};

const variantBoxStyles: Record<PillVariant, ViewStyle> = {
  points: {
    backgroundColor: colors.economy.pointsYellowSoft,
    borderWidth: 1,
    borderColor: colors.economy.pointsYellow,
  },
  primary: {
    backgroundColor: colors.brand.primarySoft,
  },
  mint: {
    backgroundColor: colors.economy.moneyMintSoft,
  },
  warning: {
    backgroundColor: '#FFEDD5',
  },
  danger: {
    backgroundColor: '#FEE2E2',
  },
  neutral: {
    backgroundColor: colors.background.divider,
  },
};

export const Pill: React.FC<PillProps> = ({
  label,
  variant = 'points',
  icon,
  style,
  testID,
}) => {
  return (
    <View style={[styles.base, variantBoxStyles[variant], style]} testID={testID}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={[styles.text, variantTextStyles[variant]]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 4,
  },
  icon: {
    fontSize: 13,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
});
