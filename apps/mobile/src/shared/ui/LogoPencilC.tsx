import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export interface LogoPencilCProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  testID?: string;
}

/**
 * Official Cambiazo Isologo (<LogoPencilC />)
 * Uses the high-resolution 3D Curved Pencil "C" asset (assets/logo-pencil-c.jpg).
 */
export const LogoPencilC: React.FC<LogoPencilCProps> = ({
  size = 'md',
  showLabel = true,
  testID = 'logo-pencil-c',
}) => {
  const dimensions =
    size === 'sm'
      ? { box: 38, radius: 10, tagFont: 15 }
      : size === 'lg'
      ? { box: 72, radius: 18, tagFont: 24 }
      : { box: 48, radius: 12, tagFont: 18 };

  return (
    <View style={styles.container} testID={testID}>
      <View
        style={[
          styles.badge,
          {
            width: dimensions.box,
            height: dimensions.box,
            borderRadius: dimensions.radius,
          },
        ]}
      >
        <Image
          source={require('../../../assets/logo-pencil-c.jpg')}
          style={{
            width: dimensions.box - 4,
            height: dimensions.box - 4,
            borderRadius: dimensions.radius - 2,
          }}
          resizeMode="contain"
        />
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
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
