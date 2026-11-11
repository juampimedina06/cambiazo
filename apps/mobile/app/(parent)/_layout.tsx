import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Redirect, Slot, useRouter, useSegments } from 'expo-router';
import { colors } from '../../src/shared/theme/colors';
import { authStore, type AuthState } from '../../src/shared/store/auth-store';
import { PARENT_NAV_ITEMS, RoleBottomNav, pathFromSegments } from '../../src/shared/ui';

export default function ParentLayout() {
  const router = useRouter();
  const segments = useSegments();
  const activePath = pathFromSegments(segments);
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
      <RoleBottomNav
        items={PARENT_NAV_ITEMS}
        activePath={activePath}
        onNavigate={(href) => router.replace(href)}
        testID="nav-bar-parent"
      />
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
