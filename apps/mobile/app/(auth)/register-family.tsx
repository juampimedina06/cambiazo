import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../src/shared/theme/colors.js';
import { RegisterFamilyForm } from '../../src/features/parental-consent/ui/RegisterFamilyForm.js';
import { DigitalConsentModal } from '../../src/features/parental-consent/ui/DigitalConsentModal.js';
import {
  type MockParentUser,
  type MockStudentUser,
} from '../../src/shared/api/mock-client.js';

export default function RegisterFamilyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; institution?: string }>();
  const inviteCode = params.code || 'BELGRANO2026';
  const institutionName = params.institution || 'Colegio Manuel Belgrano';

  const [registeredParent, setRegisteredParent] = useState<MockParentUser | null>(null);
  const [registeredStudent, setRegisteredStudent] = useState<MockStudentUser | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);

  const handleRegistrationSuccess = (parent: MockParentUser, student: MockStudentUser) => {
    setRegisteredParent(parent);
    setRegisteredStudent(student);
    setShowConsentModal(true);
  };

  const handleConsentGranted = (_consentId: string) => {
    setShowConsentModal(false);
    // Navigate to Parent Dashboard
    router.replace('/(parent)');
  };

  const handleConsentClose = () => {
    setShowConsentModal(false);
    // Even if skipped or closed, go to parent dashboard where pending state is visible
    router.replace('/(parent)');
  };

  return (
    <View style={styles.container} testID="screen-register-family">
      <RegisterFamilyForm
        inviteCode={inviteCode}
        institutionName={institutionName}
        onSuccess={handleRegistrationSuccess}
      />

      <DigitalConsentModal
        visible={showConsentModal}
        student={registeredStudent}
        parentName={registeredParent?.fullName || ''}
        institutionName={institutionName}
        onConsentGranted={handleConsentGranted}
        onClose={handleConsentClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
});
