import React from 'react';
import { useRouter } from 'expo-router';
import { StudentBlockedView } from '../../src/features/parental-consent/ui/StudentBlockedView';
import { authStore, resolveSessionContext } from '../../src/shared/store/auth-store';

export default function StudentBlockedScreen() {
  const router = useRouter();
  const state = authStore.getState();

  const { student, institutionName } = resolveSessionContext(state);
  const consentStatus = student?.consentStatus || 'PENDING';

  return (
    <StudentBlockedView
      studentName={student?.fullName || 'Alumno'}
      institutionName={institutionName}
      consentStatus={consentStatus}
      onRefreshStatus={async () => {
        if (student) {
          await authStore.refreshStudentFromBackend(student.id);
          const updated = authStore.getState().student;
          if (updated?.consentStatus === 'GRANTED') {
            router.replace('/(student)');
          }
        }
      }}
      onSwitchUser={() => {
        if (state.currentRole === 'PARENT' && state.parent) {
          router.replace('/(parent)');
          return;
        }
        authStore.logout();
        router.replace('/(auth)/school-code');
      }}
      testID="screen-student-blocked"
    />
  );
}
