import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Slot } from 'expo-router';
import { colors } from '../src/shared/theme/colors';

export default function RootLayout() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.canvas}>
        <Slot />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  canvas: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
});
