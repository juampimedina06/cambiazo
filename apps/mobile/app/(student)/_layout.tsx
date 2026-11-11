import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Redirect, Slot, useRouter, useSegments } from 'expo-router';
import { colors } from '../../src/shared/theme/colors';
import { authStore, type AuthState } from '../../src/shared/store/auth-store';
import { StudentBlockedView } from '../../src/features/parental-consent/ui/StudentBlockedView';
import {
  RoleBottomNav,
  STUDENT_HIDDEN_NAV_ROUTES,
  STUDENT_NAV_ITEMS,
  pathFromSegments,
} from '../../src/shared/ui';

/**
 * Student Layout with strict Parental Consent Gate (Ley 25.326):
 * If student does NOT have 'GRANTED' consent, renders StudentBlockedView
 * and prevents access to the student home and features.
 */
export default function StudentLayout() {
  const router = useRouter();
  const segments = useSegments();
  const activePath = pathFromSegments(segments);
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());

  useEffect(() => {
    return authStore.subscribe((state) => {
      setAuthState(state);
    });
  }, []);

  if (!authState.student) {
    return <Redirect href="/(auth)/school-code" />;
  }

  const student = authState.student;
  const institutionName = authState.institution?.name || 'Institución Escolar';

  const consentStatus = student.consentStatus || 'PENDING';

  // CONSENT GATE:
  // If student does not have GRANTED consent, render friendly blocked screen
  if (consentStatus !== 'GRANTED') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StudentBlockedView
          studentName={student.fullName}
          institutionName={institutionName}
          consentStatus={consentStatus}
          onRefreshStatus={async () => {
            await authStore.refreshStudentFromBackend(student.id);
          }}
          onSwitchUser={() => {
            if (authState.currentRole === 'PARENT' && authState.parent) {
              router.replace('/(parent)');
              return;
            }
            authStore.logout();
            router.replace('/(auth)/school-code');
          }}
          testID="gate-student-blocked"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Slot />
      </View>
      <RoleBottomNav
        items={STUDENT_NAV_ITEMS}
        activePath={activePath}
        hiddenRoutes={STUDENT_HIDDEN_NAV_ROUTES}
        onNavigate={(href) => router.replace(href)}
        testID="nav-bar-student"
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
