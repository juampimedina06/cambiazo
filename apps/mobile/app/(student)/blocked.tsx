import React from 'react';
import { useRouter } from 'expo-router';
import { StudentBlockedView } from '../../src/features/parental-consent/ui/StudentBlockedView.js';
import { authStore } from '../../src/shared/store/auth-store.js';
import { mockApiClient } from '../../src/shared/api/mock-client.js';

export default function StudentBlockedScreen() {
  const router = useRouter();
  const state = authStore.getState();

  const student = state.student || mockApiClient.getStudent('22222222-2222-4222-8222-222222222222');
  const consentStatus = student?.consentStatus || 'PENDING';
  const institutionName = state.institution?.name || 'Colegio Manuel Belgrano';

  return (
    <StudentBlockedView
      studentName={student?.fullName || 'Mateo'}
      institutionName={institutionName}
      consentStatus={consentStatus}
      onRefreshStatus={() => {
        if (student) {
          authStore.refreshStudentFromClient(student.id);
          const updated = authStore.getState().student;
          if (updated?.consentStatus === 'GRANTED') {
            router.replace('/(student)');
          }
        }
      }}
      onSwitchUser={() => {
        router.replace('/(parent)');
      }}
      testID="screen-student-blocked"
    />
  );
}
