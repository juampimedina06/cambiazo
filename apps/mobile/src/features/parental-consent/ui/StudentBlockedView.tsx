import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldAlert, FileText, Lightbulb } from 'lucide-react-native';
import { type ConsentStatus } from '@cambiazo/shared';
import { colors } from '../../../shared/theme/colors';
import { Button } from '../../../shared/ui/Button';
import { LogoPencilC } from '../../../shared/ui/LogoPencilC';
import { ConsentStatusBadge } from '../../../entities/student-profile/ui/ConsentStatusBadge';

export interface StudentBlockedViewProps {
  studentName: string;
  institutionName?: string;
  consentStatus: ConsentStatus;
  onRefreshStatus?: () => void;
  onSwitchUser?: () => void;
  testID?: string;
}

/**
 * Pantalla de Bloqueo Amigable para el Alumno (Friendly Consent Gate).
 * Tono educativo, nunca punitivo: explica con calidez que se requiere la
 * autorización digital del tutor bajo la Ley 25.326 para operar en el recreo.
 */
export const StudentBlockedView: React.FC<StudentBlockedViewProps> = ({
  studentName,
  institutionName = 'tu colegio',
  consentStatus,
  onRefreshStatus,
  onSwitchUser,
  testID = 'student-blocked-view',
}) => {
  const isRevoked = consentStatus === 'REVOKED';
  const firstName = studentName.split(' ')[0] || studentName;

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <LogoPencilC size="md" showLabel={true} />
      </View>

      <View style={styles.illustrationBox}>
        <View style={styles.iconCircle}>
          {isRevoked ? (
            <ShieldAlert size={44} color={colors.status.danger} />
          ) : (
            <FileText size={44} color={colors.brand.primary} />
          )}
        </View>
        <ConsentStatusBadge status={consentStatus} testID="blocked-consent-status-badge" />
      </View>

      <Text style={styles.title}>
        {isRevoked ? `¡Hola, ${firstName}! Cuenta en pausa` : `¡Casi listos, ${firstName}!`}
      </Text>

      <Text style={styles.message}>
        {isRevoked
          ? `Tu tutor responsable pausó temporalmente el acceso a Cambiazo en ${institutionName}. Hablá con tu familia para volver a activarlo.`
          : `Para poder pagar en el recreo con QR y participar del intercambio de útiles en ${institutionName}, tu mamá, papá o tutor tiene que firmar la autorización digital en la app.`}
      </Text>

      <View style={styles.hintBox}>
        <View style={styles.hintIconWrapper}>
          <Lightbulb size={20} color={colors.economy.pointsYellowDark} />
        </View>
        <View style={styles.hintTextWrapper}>
          <Text style={styles.hintTitle}>¿Qué podés hacer ahora?</Text>
          <Text style={styles.hintDesc}>
            {isRevoked
              ? 'Pedile a tu tutor que ingrese a su perfil de Cambiazo y reactive el consentimiento escolar.'
              : 'Pedile a tu tutor que abra Cambiazo en su celular y firme el consentimiento escolar (Ley 25.326). ¡Tarda menos de un minuto!'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {onRefreshStatus && (
          <Button
            label="Verificar si ya lo firmaron"
            onPress={onRefreshStatus}
            variant="mint"
            testID="btn-refresh-consent"
          />
        )}

        {onSwitchUser && (
          <Button
            label="Cambiar de Cuenta / Salir"
            onPress={onSwitchUser}
            variant="secondary"
            testID="btn-switch-user"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  illustrationBox: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  hintBox: {
    flexDirection: 'row',
    backgroundColor: colors.background.surface,
    padding: 16,
    borderRadius: 18,
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.brand.primarySoft,
    marginBottom: 32,
  },
  hintIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.economy.pointsYellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  hintTextWrapper: {
    flex: 1,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand.primaryDark,
    marginBottom: 4,
  },
  hintDesc: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  actions: {
    gap: 12,
  },
});
