import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

export type ButtonVariant = 'primary' | 'secondary' | 'mint' | 'yellow' | 'danger' | 'outline';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.brand.primary },
  secondary: { backgroundColor: colors.brand.primarySoft },
  mint: { backgroundColor: colors.economy.moneyMint },
  yellow: { backgroundColor: colors.economy.pointsYellow },
  danger: { backgroundColor: colors.status.danger },
  outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.brand.primary },
};

const variantTextStyles: Record<ButtonVariant, TextStyle> = {
  primary: { color: colors.text.inverse },
  secondary: { color: colors.brand.primaryDark },
  mint: { color: colors.text.inverse },
  yellow: { color: colors.brand.primaryDark },
  danger: { color: colors.text.inverse },
  outline: { color: colors.brand.primary },
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  fullWidth = true,
  style,
  testID,
}) => {
  const containerStyles = [
    styles.base,
    variantStyles[variant],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.textBase,
    variantTextStyles[variant],
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={containerStyles as any}
      testID={testID}
    >
      <Text style={textStyles as any}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: layout.button.minHeight,
    borderRadius: layout.button.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  textBase: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabledText: {
    color: colors.text.muted,
  },
});
