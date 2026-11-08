import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Slot } from 'expo-router';
import { colors } from '../../src/shared/theme/colors.js';

export default function KioskLayout() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Slot />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
