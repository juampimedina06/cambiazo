import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { colors } from '../../src/shared/theme/colors';
import { authStore, type AuthState } from '../../src/shared/store/auth-store';
import { mockApiClient } from '../../src/shared/api/mock-client';
import { StudentBlockedView } from '../../src/features/parental-consent/ui/StudentBlockedView';

/**
 * Student Layout with strict Parental Consent Gate (Ley 25.326):
 * If student does NOT have 'GRANTED' consent, renders StudentBlockedView
 * and prevents access to the student home and features.
 */
export default function StudentLayout() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());

  useEffect(() => {
    return authStore.subscribe((state) => {
      setAuthState(state);
    });
  }, []);

  const student = authState.student || mockApiClient.getStudent('22222222-2222-4222-8222-222222222222');
  const institutionName = authState.institution?.name || 'Colegio Manuel Belgrano';

  const consentStatus = student?.consentStatus || 'PENDING';

  // CONSENT GATE:
  // If student does not have GRANTED consent, render friendly blocked screen
  if (consentStatus !== 'GRANTED') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StudentBlockedView
          studentName={student?.fullName || 'Mateo'}
          institutionName={institutionName}
          consentStatus={consentStatus}
          onRefreshStatus={() => {
            if (student) {
              authStore.refreshStudentFromClient(student.id);
            }
          }}
          onSwitchUser={() => {
            router.replace('/(parent)');
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
