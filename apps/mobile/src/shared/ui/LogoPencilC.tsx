import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors.js';

export interface LogoPencilCProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

/**
 * Isologo: Un lápiz flexible curvado formando la letra "C"
 * en color Amarillo Vibrante (#FACC15), con punta de grafito y goma en tonos morados (#6C3CE9).
 */
export const LogoPencilC: React.FC<LogoPencilCProps> = ({ size = 'md', showLabel = true }) => {
  const dimensions = size === 'sm' ? { box: 36, font: 20, tagFont: 14 } : size === 'lg' ? { box: 64, font: 36, tagFont: 22 } : { box: 48, font: 28, tagFont: 18 };

  return (
    <View style={styles.container} testID="logo-pencil-c">
      <View
        style={[
          styles.badge,
          {
            width: dimensions.box,
            height: dimensions.box,
            borderRadius: dimensions.box / 2,
          },
        ]}
      >
        <Text
          style={[
            styles.letterC,
            {
              fontSize: dimensions.font,
            },
          ]}
        >
          C
        </Text>
        <View style={styles.graphiteTip} />
      </View>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.brandName, { fontSize: dimensions.tagFont }]}>
            CAMBIA<Text style={styles.brandZ}>Z</Text>O
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    backgroundColor: colors.economy.pointsYellow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brand.primary,
    position: 'relative',
  },
  letterC: {
    fontWeight: '800',
    color: colors.brand.primaryDark,
    textAlign: 'center',
  },
  graphiteTip: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.primary,
  },
  labelContainer: {
    justifyContent: 'center',
  },
  brandName: {
    fontWeight: '800',
    color: colors.brand.primaryDark,
    letterSpacing: 1,
  },
  brandZ: {
    color: colors.economy.pointsYellowDark,
  },
});
