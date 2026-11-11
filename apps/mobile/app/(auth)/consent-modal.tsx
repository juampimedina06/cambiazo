import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../src/shared/theme/colors';
import { DigitalConsentContent } from '../../src/features/parental-consent/ui/DigitalConsentContent';
import { authStore } from '../../src/shared/store/auth-store';

export default function ConsentModalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string }>();
  const state = authStore.getState();

  const studentId = params.studentId || state.student?.id;
  const student = studentId
    ? state.students.find((s) => s.id === studentId) || state.student
    : state.student;
  const parentName = state.parent?.fullName || 'Tutor Responsable';
  const institutionName = state.institution?.name || 'Institución Escolar';

  if (!student) {
    return null;
  }

  const handleConsentGranted = () => {
    router.replace('/(parent)');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container} testID="screen-consent-modal">
      <DigitalConsentContent
        student={student}
        parentName={parentName}
        institutionName={institutionName}
        onConsentGranted={handleConsentGranted}
        onCancel={handleCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
