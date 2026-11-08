import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../../shared/theme/colors.js';
import { Button } from '../../../shared/ui/Button.js';
import { Pill } from '../../../shared/ui/Pill.js';
import { useParentalConsent } from '../hooks/useParentalConsent.js';
import { type MockStudentUser } from '../../../shared/api/mock-client.js';

export interface DigitalConsentContentProps {
  student: MockStudentUser;
  parentName: string;
  institutionName?: string;
  onConsentGranted: (consentId: string) => void;
  onCancel?: () => void;
  testID?: string;
}

/**
 * Pantalla legal clara y sin jerga técnica para la firma digital
 * del Consentimiento Parental (Ley 25.326 - Protección de los Datos Personales).
 */
export const DigitalConsentContent: React.FC<DigitalConsentContentProps> = ({
  student,
  parentName,
  institutionName = 'la institución escolar',
  onConsentGranted,
  onCancel,
  testID = 'digital-consent-content',
}) => {
  const [acceptedCheckbox, setAcceptedCheckbox] = useState(false);
  const { isLoading, error, grantConsent } = useParentalConsent();

  const handleSign = async () => {
    if (!acceptedCheckbox) return;

    const result = await grantConsent({
      studentId: student.id,
      acceptedTermsVersion: 'v1.0-ley25326',
      signatureIp: '181.164.20.15',
    });

    if (result.success && result.consentRecord) {
      onConsentGranted(result.consentRecord.id);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      testID={testID}
    >
      <View style={styles.badgeRow}>
        <Pill label="Ley Nacional 25.326" variant="primary" icon="⚖️" />
        <Pill label="Firma Digital Auditable" variant="mint" icon="🔒" />
      </View>

      <Text style={styles.title}>Autorización y Consentimiento Parental</Text>
      <Text style={styles.subtitle}>
        Para proteger la privacidad de tu hijo/a y cumplir con la legislación argentina,
        necesitamos tu conformidad informada.
      </Text>

      {/* SUMMARY CARD (Flat surface, no nested cards) */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Resumen del Alumno Vinculado</Text>
        <Text style={styles.summaryItem}>• Alumno: <Text style={styles.bold}>{student.fullName}</Text></Text>
        <Text style={styles.summaryItem}>• DNI: <Text style={styles.bold}>{student.dni}</Text></Text>
        <Text style={styles.summaryItem}>• Curso: <Text style={styles.bold}>{student.grade}</Text></Text>
        <Text style={styles.summaryItem}>• Escuela: <Text style={styles.bold}>{institutionName}</Text></Text>
        <Text style={styles.summaryItem}>• Tutor Responsable: <Text style={styles.bold}>{parentName}</Text></Text>
      </View>

      {/* LEGAL BULLETS IN PLAIN LANGUAGE */}
      <View style={styles.legalBody}>
        <Text style={styles.legalHeading}>¿Qué autorizás en términos simples?</Text>

        <View style={styles.bulletItem}>
          <Text style={styles.bulletIcon}>🍔</Text>
          <View style={styles.bulletTextWrapper}>
            <Text style={styles.bulletTitle}>Consumos del Kiosco Escolar</Text>
            <Text style={styles.bulletText}>
              Permitir que el alumno utilice su saldo prepago en pesos para compras presenciales en el kiosco, respetando los límites diarios y restricciones nutricionales que vos configures.
            </Text>
          </View>
        </View>

        <View style={styles.bulletItem}>
          <Text style={styles.bulletIcon}>🔄</Text>
          <View style={styles.bulletTextWrapper}>
            <Text style={styles.bulletTitle}>Comunidad de Útiles Escolares</Text>
            <Text style={styles.bulletText}>
              Permitir su participación en el intercambio, donación y préstamo de libros y útiles dentro del colegio, acumulando puntos de comunidad no canjeables por dinero.
            </Text>
          </View>
        </View>

        <View style={styles.bulletItem}>
          <Text style={styles.bulletIcon}>🛡️</Text>
          <View style={styles.bulletTextWrapper}>
            <Text style={styles.bulletTitle}>Protección de Datos y Control Total</Text>
            <Text style={styles.bulletText}>
              Tus datos y los de tu hijo/a nunca se ceden a terceros con fines comerciales ni de publicidad. Podés revocar esta autorización en cualquier momento desde tu panel de tutor.
            </Text>
          </View>
        </View>
      </View>

      {/* CHECKBOX */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setAcceptedCheckbox(!acceptedCheckbox)}
        activeOpacity={0.8}
        testID="checkbox-accept-consent"
      >
        <View style={[styles.checkbox, acceptedCheckbox && styles.checkboxActive]}>
          {acceptedCheckbox && <Text style={styles.checkboxCheck}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          He leído y acepto los términos de uso escolar y doy mi consentimiento expreso para la habilitación de la cuenta de mi hijo/a conforme la Ley 25.326.
        </Text>
      </TouchableOpacity>

      {error && (
        <View style={styles.errorBox} testID="consent-error-box">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ACTIONS */}
      <View style={styles.actions}>
        <Button
          label={isLoading ? 'Firmando digitalmente...' : 'Firmar Consentimiento Digital'}
          onPress={handleSign}
          variant="primary"
          disabled={!acceptedCheckbox || isLoading}
          testID="btn-sign-consent"
        />

        {onCancel && (
          <Button
            label="Volver / Completar más tarde"
            onPress={onCancel}
            variant="outline"
            style={styles.cancelBtn}
            testID="btn-cancel-consent"
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    paddingBottom: 40,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  summaryBox: {
    backgroundColor: colors.brand.primarySoft,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.brand.primaryDark,
    marginBottom: 8,
  },
  summaryItem: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
  },
  legalBody: {
    gap: 16,
    marginBottom: 24,
  },
  legalHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  bulletItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  bulletIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  bulletTextWrapper: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  bulletText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.background.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.brand.primarySoft,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: colors.brand.primary,
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.status.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    gap: 12,
  },
  cancelBtn: {
    marginTop: 4,
  },
});
