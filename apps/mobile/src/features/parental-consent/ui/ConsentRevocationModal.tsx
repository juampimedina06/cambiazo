import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, SafeAreaView } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { RevokeParentalConsentSchema } from '@cambiazo/shared';
import { colors } from '../../../shared/theme/colors';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Pill } from '../../../shared/ui/Pill';
import { useParentalConsent } from '../hooks/useParentalConsent';
import { ensureUuid } from '../../../shared/api/mock-client';

export interface ConsentRevocationModalProps {
  visible: boolean;
  studentId: string;
  studentName: string;
  onRevoked: () => void;
  onClose: () => void;
  testID?: string;
}

export const ConsentRevocationModal: React.FC<ConsentRevocationModalProps> = ({
  visible,
  studentId,
  studentName,
  onRevoked,
  onClose,
  testID = 'consent-revocation-modal',
}) => {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const { isLoading, error, revokeConsent } = useParentalConsent();

  const handleConfirmRevocation = async () => {
    const trimmed = reason.trim();
    const validStudentId = ensureUuid(studentId);
    const validation = RevokeParentalConsentSchema.safeParse({
      studentId: validStudentId,
      reason: trimmed,
    });

    if (!validation.success) {
      setReasonError(validation.error.errors[0]?.message || 'El motivo debe tener al menos 3 caracteres');
      return;
    }

    setReasonError(null);
    const result = await revokeConsent({
      studentId: validStudentId,
      reason: trimmed,
    });

    if (result.success) {
      setReason('');
      onRevoked();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container} testID={testID}>
          <Pill
            label="Acción de Seguridad"
            variant="danger"
            icon={<AlertTriangle size={13} color={colors.status.danger} />}
          />

          <Text style={styles.title}>Revocar Consentimiento Escolar</Text>
          <Text style={styles.subtitle}>
            Al revocar el consentimiento, la cuenta de <Text style={styles.bold}>{studentName}</Text> quedará
            inmediatamente pausada y no podrá realizar compras en el kiosco escolar ni operar en la plataforma.
          </Text>

          <View style={styles.warningBox}>
            <View style={styles.warningTitleRow}>
              <AlertTriangle size={15} color={colors.status.danger} />
              <Text style={styles.warningTitle}>Efecto Inmediato (Ley 25.326)</Text>
            </View>
            <Text style={styles.warningText}>
              El saldo restante en pesos queda resguardado y seguro en la cuenta familiar. Podrás reactivar el
              consentimiento en cualquier momento.
            </Text>
          </View>

          <Input
            label="Motivo de la revocación (requerido por auditoría)"
            placeholder="Ej: Prefiero pausar temporalmente los consumos en el recreo"
            value={reason}
            onChangeText={(t) => {
              setReason(t);
              setReasonError(null);
            }}
            error={reasonError || error || undefined}
            helperText="Mínimo 3 caracteres. Quedará asentado en el registro de control parental."
            testID="input-revocation-reason"
          />

          <View style={styles.actions}>
            <Button
              label={isLoading ? 'Revocando...' : 'Confirmar Revocación y Pausar Cuenta'}
              onPress={handleConfirmRevocation}
              variant="danger"
              disabled={reason.trim().length < 3 || isLoading}
              testID="btn-confirm-revocation"
            />

            <Button
              label="Cancelar"
              onPress={onClose}
              variant="outline"
              disabled={isLoading}
              testID="btn-cancel-revocation"
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
    color: colors.status.danger,
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  bold: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  warningBox: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: colors.status.warning,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  warningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#C2410C',
  },
  warningText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
    marginTop: 16,
  },
});
