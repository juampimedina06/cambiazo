import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, LogIn } from 'lucide-react-native';
import { colors } from '../../src/shared/theme/colors';
import { RegisterFamilyForm } from '../../src/features/parental-consent/ui/RegisterFamilyForm';
import { DigitalConsentModal } from '../../src/features/parental-consent/ui/DigitalConsentModal';
import {
  type ParentProfile,
  type StudentProfile,
} from '../../src/core';
import { authStore } from '../../src/shared/store/auth-store';

export default function RegisterFamilyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; institution?: string }>();
  const storedInstitution = authStore.getState().institution;
  const inviteCode = params.code || storedInstitution?.code || '';
  const institutionName = params.institution || storedInstitution?.name || 'Institución Escolar';

  const [registeredParent, setRegisteredParent] = useState<ParentProfile | null>(null);
  const [registeredStudent, setRegisteredStudent] = useState<StudentProfile | null>(null);
  const [registeredStudents, setRegisteredStudents] = useState<StudentProfile[]>([]);
  const [consentQueueIndex, setConsentQueueIndex] = useState(0);
  const [showConsentModal, setShowConsentModal] = useState(false);

  const handleGoToLogin = () => {
    router.replace(
      `/(auth)/login?code=${encodeURIComponent(inviteCode)}&institution=${encodeURIComponent(institutionName)}`
    );
  };

  const handleRegistrationSuccess = (parent: ParentProfile, student: StudentProfile) => {
    const allStudents = authStore.getState().students;
    const queue = allStudents.length > 0 ? allStudents : [student];
    setRegisteredParent(parent);
    setRegisteredStudents(queue);
    setConsentQueueIndex(0);
    setRegisteredStudent(queue[0] ?? student);
    setShowConsentModal(true);
  };

  const handleConsentGranted = (_consentId: string) => {
    const nextIndex = consentQueueIndex + 1;
    if (nextIndex < registeredStudents.length) {
      setConsentQueueIndex(nextIndex);
      setRegisteredStudent(registeredStudents[nextIndex]!);
      return;
    }
    setShowConsentModal(false);
    router.replace('/(parent)');
  };

  const handleConsentClose = () => {
    setShowConsentModal(false);
    // Even if skipped or closed, go to parent dashboard where pending state is visible
    router.replace('/(parent)');
  };

  return (
    <View style={styles.container} testID="screen-register-family">
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navLink}
          testID="btn-register-back"
        >
          <ArrowLeft size={16} color={colors.text.secondary} />
          <Text style={styles.navBackText}>Volver</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGoToLogin}
          style={styles.switchToLogin}
          testID="btn-switch-to-login"
        >
          <LogIn size={15} color={colors.brand.primary} />
          <Text style={styles.switchToLoginText}>Ya tengo cuenta</Text>
        </TouchableOpacity>
      </View>

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
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  navBackText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  switchToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  switchToLoginText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand.primaryDark,
  },
});
