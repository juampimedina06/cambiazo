import React from 'react';
import { Modal, View, StyleSheet, SafeAreaView } from 'react-native';
import { colors } from '../../../shared/theme/colors';
import { DigitalConsentContent } from './DigitalConsentContent';
import { type MockStudentUser } from '../../../shared/api/mock-client';

export interface DigitalConsentModalProps {
  visible: boolean;
  student: MockStudentUser | null;
  parentName: string;
  institutionName?: string;
  onConsentGranted: (consentId: string) => void;
  onClose: () => void;
}

export const DigitalConsentModal: React.FC<DigitalConsentModalProps> = ({
  visible,
  student,
  parentName,
  institutionName,
  onConsentGranted,
  onClose,
}) => {
  if (!student) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <DigitalConsentContent
            student={student}
            parentName={parentName}
            institutionName={institutionName}
            onConsentGranted={onConsentGranted}
            onCancel={onClose}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: colors.background.canvas,
  },
});
