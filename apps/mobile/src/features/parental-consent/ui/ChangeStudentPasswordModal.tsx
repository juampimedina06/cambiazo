import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, SafeAreaView } from 'react-native';
import { KeyRound } from 'lucide-react-native';
import { ChangeStudentPasswordSchema } from '@cambiazo/shared';
import { colors } from '../../../shared/theme/colors';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Pill } from '../../../shared/ui/Pill';
import { changeStudentPasswordAction, type ApiAuthContext } from '../../../core';

export interface ChangeStudentPasswordModalProps {
  visible: boolean;
  studentId: string;
  studentName: string;
  auth: ApiAuthContext;
  onSuccess?: () => void;
  onClose: () => void;
  testID?: string;
}

export const ChangeStudentPasswordModal: React.FC<ChangeStudentPasswordModalProps> = ({
  visible,
  studentId,
  studentName,
  auth,
  onSuccess,
  onClose,
  testID = 'change-student-password-modal',
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    onClose();
  };

  const handleSave = async () => {
    const trimmed = newPassword.trim();
    const validation = ChangeStudentPasswordSchema.safeParse({
      studentId: auth.role === 'PARENT' ? studentId : undefined,
      newPassword: trimmed,
    });

    if (!validation.success) {
      setError(
        validation.error.errors[0]?.message ||
          'La contraseña debe tener al menos 4 caracteres.'
      );
      return;
    }

    if (trimmed !== confirmPassword.trim()) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const result = await changeStudentPasswordAction(
        {
          studentId: auth.role === 'PARENT' ? studentId : undefined,
          newPassword: trimmed,
        },
        auth
      );
      if (!result.success) {
        setError(result.error || 'No se pudo actualizar la clave.');
        return;
      }
      setNewPassword('');
      setConfirmPassword('');
      onSuccess?.();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container} testID={testID}>
          <Pill
            label="Acceso Escolar"
            variant="primary"
            icon={<KeyRound size={13} color={colors.brand.primaryDark} />}
          />

          <Text style={styles.title}>Cambiar Clave de Alumno</Text>
          <Text style={styles.subtitle}>
            Elegí una contraseña propia para que <Text style={styles.bold}>{studentName}</Text> ingrese con su DNI.
          </Text>

          <Input
            label="Nueva contraseña (mínimo 4 caracteres)"
            placeholder="••••••••"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setError(null);
            }}
            secureTextEntry
            testID="input-new-student-password"
          />

          <Input
            label="Confirmar nueva contraseña"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setError(null);
            }}
            secureTextEntry
            error={error || undefined}
            helperText="La clave de tu cuenta de tutor no se modifica."
            testID="input-confirm-student-password"
          />

          <View style={styles.actions}>
            <Button
              label={isSaving ? 'Guardando...' : 'Guardar Nueva Clave'}
              onPress={handleSave}
              variant="primary"
              disabled={isSaving || newPassword.trim().length < 4}
              testID="btn-save-student-password"
            />
            <Button
              label="Cancelar"
              onPress={handleClose}
              variant="outline"
              disabled={isSaving}
              testID="btn-cancel-student-password"
            />
          </View>
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
    padding: 24,
    backgroundColor: colors.background.canvas,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.brand.primaryDark,
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  bold: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  actions: {
    gap: 12,
    marginTop: 16,
  },
});

