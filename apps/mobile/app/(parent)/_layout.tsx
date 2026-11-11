import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Redirect, Slot } from 'expo-router';
import { colors } from '../../src/shared/theme/colors';
import { authStore, type AuthState } from '../../src/shared/store/auth-store';

export default function ParentLayout() {
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());

  useEffect(() => {
    return authStore.subscribe((state) => {
      setAuthState(state);
    });
  }, []);

  if (process.env.NODE_ENV !== 'test' && (!authState.parent || authState.currentRole !== 'PARENT')) {
    return <Redirect href="/(auth)/school-code" />;
  }

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
