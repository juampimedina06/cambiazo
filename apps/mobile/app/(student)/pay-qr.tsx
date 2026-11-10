import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/shared/theme/colors';
import { Button } from '../../src/shared/ui/Button';
import { Pill } from '../../src/shared/ui/Pill';
import { authStore, type AuthState } from '../../src/shared/store/auth-store';
import { mockApiClient } from '../../src/shared/api/mock-client';
import { QrPaymentTokenSchema, type QrPaymentTokenDto } from '@cambiazo/shared';

export default function PayQrScreen() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());
  const [qrToken, setQrToken] = useState<QrPaymentTokenDto | null>(null);
  const [backupCode, setBackupCode] = useState<string>('------');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const student = authState.student || mockApiClient.getStudent('22222222-2222-4222-8222-222222222222');
  const studentId = student?.id || '22222222-2222-4222-8222-222222222222';

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadQrToken = async () => {
    if (!studentId) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setErrorMessage(null);
    setIsExpired(false);
    setSecondsRemaining(120);

    const res = await mockApiClient.generateQrPaymentToken(studentId);
    if (!res.success || !res.qrToken || !res.backupCode) {
      setErrorMessage(res.error || 'No se pudo generar el código QR.');
      return;
    }

    // Validate with QrPaymentTokenSchema
    const validation = QrPaymentTokenSchema.safeParse(res.qrToken);
    if (!validation.success) {
      setErrorMessage('Token QR con formato inválido.');
      return;
    }

    setQrToken(res.qrToken);
    setBackupCode(res.backupCode);

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    loadQrToken();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [studentId]);

  const formattedCode = backupCode.length === 6 ? `${backupCode.slice(0, 3)} ${backupCode.slice(3)}` : backupCode;

  const balanceArs = ((student?.balanceArsCents ?? 450000) / 100).toLocaleString('es-AR');

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      testID="screen-pay-qr"
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.replace('/(student)')}
          style={styles.backButton}
          testID="btn-pay-qr-back"
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Pill label="Billetera Escolar" variant="primary" icon="⚡" />
      </View>

      <Text style={styles.title}>Pagar en Kiosco</Text>
      <Text style={styles.subtitle}>
        Mostrá este código o dictá los 6 dígitos al kiosquero en el recreo.
      </Text>

      {errorMessage ? (
        <View style={styles.errorBox} testID="box-qr-error">
          <Text style={styles.errorTitle}>⚠️ Pago No Disponible</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Button
            label="Volver a Mi Billetera"
            onPress={() => router.replace('/(student)')}
            variant="secondary"
            style={{ marginTop: 12 }}
            testID="btn-qr-back-to-wallet"
          />
        </View>
      ) : (
        <View style={styles.qrSurface} testID="surface-qr-code">
          {/* QR Code Container */}
          <View style={[styles.qrFrame, isExpired && styles.qrFrameExpired]} testID="qr-code-frame">
            {isExpired ? (
              <View style={styles.expiredOverlay}>
                <Text style={styles.expiredIcon}>⏳</Text>
                <Text style={styles.expiredLabel}>Código Expirado</Text>
                <Text style={styles.expiredHelp}>
                  Por seguridad, los códigos duran 2 minutos. Generá uno nuevo para pagar.
                </Text>
              </View>
            ) : (
              <View style={styles.simulatedQrMatrix} testID="simulated-qr-matrix">
                {/* Visual high-contrast stylized QR pattern */}
                <View style={styles.qrRow}>
                  <View style={styles.qrCorner} />
                  <View style={styles.qrDot} />
                  <View style={styles.qrCorner} />
                </View>
                <View style={styles.qrMiddleRow}>
                  <View style={styles.qrCenterPattern}>
                    <Text style={styles.qrCenterLogo}>C</Text>
                  </View>
                </View>
                <View style={styles.qrRow}>
                  <View style={styles.qrCorner} />
                  <View style={styles.qrDot} />
                  <View style={styles.qrCorner} />
                </View>
              </View>
            )}
          </View>

          {/* 6-Digit Large Code for Manual Dictation */}
          <View style={styles.codeContainer} testID="container-backup-code">
            <Text style={styles.codeLabel}>Código de 6 dígitos:</Text>
            <Text style={[styles.codeText, isExpired && styles.codeTextExpired]} testID="text-6digit-code">
              {formattedCode}
            </Text>
          </View>

          {/* 120s Countdown Timer */}
          <View style={styles.timerBadge} testID="badge-timer-countdown">
            <Text style={styles.timerEmoji}>{isExpired ? '⚠️' : '⏱️'}</Text>
            <Text style={[styles.timerText, isExpired && styles.timerTextExpired]} testID="text-countdown-seconds">
              {isExpired ? 'Código vencido' : `Vence en ${secondsRemaining}s`}
            </Text>
          </View>

          {/* Refresh Action if Expired */}
          {isExpired ? (
            <Button
              label="Generar Nuevo Código QR"
              onPress={loadQrToken}
              variant="mint"
              style={styles.refreshButton}
              testID="btn-refresh-qr"
            />
          ) : (
            <TouchableOpacity
              onPress={loadQrToken}
              style={styles.manualRefreshLink}
              testID="link-manual-refresh"
            >
              <Text style={styles.manualRefreshText}>🔄 Actualizar código ahora</Text>
            </TouchableOpacity>
          )}

          {/* Available balance confirmation */}
          <View style={styles.balanceFooter}>
            <Text style={styles.balanceFooterLabel}>Saldo disponible:</Text>
            <Text style={styles.balanceFooterValue}>${balanceArs}</Text>
          </View>
        </View>
      )}

      {/* Done Button */}
      <View style={styles.footerNav}>
        <Button
          label="Volver a Mi Billetera"
          onPress={() => router.replace('/(student)')}
          variant="secondary"
          testID="btn-finish-pay-qr"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 20,
  },
  qrSurface: {
    backgroundColor: colors.background.surface,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  qrFrame: {
    width: 220,
    height: 220,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: colors.brand.primary,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrFrameExpired: {
    borderColor: colors.status.danger,
    backgroundColor: '#FEF2F2',
  },
  simulatedQrMatrix: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  qrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrCorner: {
    width: 44,
    height: 44,
    backgroundColor: colors.brand.primaryDark,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  qrDot: {
    width: 20,
    height: 20,
    backgroundColor: colors.brand.primary,
    borderRadius: 4,
  },
  qrMiddleRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCenterPattern: {
    width: 50,
    height: 50,
    backgroundColor: colors.economy.pointsYellow,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCenterLogo: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.brand.primaryDark,
  },
  expiredOverlay: {
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  expiredIcon: {
    fontSize: 36,
  },
  expiredLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.status.danger,
  },
  expiredHelp: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  codeText: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.brand.primaryDark,
    letterSpacing: 4,
  },
  codeTextExpired: {
    color: colors.text.muted,
    textDecorationLine: 'line-through',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primarySoft,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    marginBottom: 16,
  },
  timerEmoji: {
    fontSize: 16,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand.primaryDark,
  },
  timerTextExpired: {
    color: colors.status.danger,
  },
  refreshButton: {
    width: '100%',
    minHeight: 52,
    marginBottom: 16,
  },
  manualRefreshLink: {
    paddingVertical: 8,
    marginBottom: 12,
  },
  manualRefreshText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.brand.primary,
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.background.divider,
    paddingTop: 14,
    width: '100%',
    justifyContent: 'center',
  },
  balanceFooterLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  balanceFooterValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.economy.moneyMintDark,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: colors.status.danger,
    padding: 20,
    borderRadius: 20,
    gap: 8,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.status.danger,
  },
  errorText: {
    fontSize: 14,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerNav: {
    marginTop: 24,
  },
});
