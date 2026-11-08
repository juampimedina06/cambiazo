import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors.js';
import { layout } from '../theme/layout.js';

export interface SurfaceProps {
  children: ReactNode;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Surface represents a top-level clean card/panel on the #F8F7FF base canvas.
 * Strict Rule: Never nest a Surface inside another Surface (No card-in-card).
 */
export const Surface: React.FC<SurfaceProps> = ({ children, style, testID }) => {
  return (
    <View style={[styles.surface, style]} testID={testID}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.background.surface,
    borderRadius: layout.surface.borderRadius,
    padding: layout.surface.padding,
  },
});
