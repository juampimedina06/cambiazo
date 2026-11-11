import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';

export interface FlatListItemProps {
  icon: React.ReactNode;
  title: string;
  highlightValue: string;
  valueType?: 'money' | 'points' | 'neutral';
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

const valueStyles: Record<'money' | 'points' | 'neutral', TextStyle> = {
  money: { color: colors.economy.moneyMint },
  points: { color: colors.economy.pointsYellowDark },
  neutral: { color: colors.text.primary },
};

export const FlatListItem: React.FC<FlatListItemProps> = ({
  icon,
  title,
  highlightValue,
  valueType = 'neutral',
  onPress,
  style,
  testID,
}) => {
  const content = (
    <View style={[styles.row, style]} testID={testID}>
      <View style={styles.left}>
        <View style={styles.iconCircle}>
          {typeof icon === 'string' ? (
            <Text style={styles.iconText}>{icon}</Text>
          ) : (
            icon
          )}
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <Text style={[styles.value, valueStyles[valueType]]}>
        {highlightValue}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.divider,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
  },
});
