import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  AppState,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Banknote,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react-native';
import { colors } from '../../../src/shared/theme/colors';
import { Button } from '../../../src/shared/ui/Button';
import { Pill } from '../../../src/shared/ui/Pill';
import { authStore, resolveSessionContext, type AuthState } from '../../../src/shared/store/auth-store';
import {
  completeTopUpAction,
  createTopUpPreferenceAction,
  fetchStudentBalanceAction,
  verifyTopUpAction,
} from '../../../src/core';
import { TopUpPreferenceRequestSchema } from '@cambiazo/shared';

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000];

export default function ParentTopUpScreen() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());
  const [selectedAmount, setSelectedAmount] = useState<number>(2000);
  const [customAmountText, setCustomAmountText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState<boolean>(false);
  const [preferenceData, setPreferenceData] = useState<{
    preferenceId: string;
    initPoint: string;
    externalReference?: string;
    isMock: boolean;
  } | null>(null);
  const [successResult, setSuccessResult] = useState<{ newBalance: number; amountLoaded: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return authStore.subscribe((state) => {
      setAuthState(state);
    });
  }, []);

  const { student, studentId, parent, institutionId } = resolveSessionContext(authState);

  useEffect(() => {
    if (!studentId || !institutionId) return;
    let cancelled = false;
    fetchStudentBalanceAction(studentId, {
      auth: {
        role: 'PARENT',
        userId: parent?.id || studentId,
        institutionId,
      },
    })
      .then((balanceArsCents) => {
        if (!cancelled) {
          authStore.updateStudentFields(studentId, { balanceArsCents });
        }
      })
      .catch(() => {
        // Ignore passive refresh error
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, institutionId, parent?.id]);

  const studentBalanceArs = ((student?.balanceArsCents ?? 0) / 100).toLocaleString('es-AR');

  const effectiveAmount = customAmountText.trim() ? parseInt(customAmountText.replace(/\D/g, ''), 10) || 0 : selectedAmount;

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmountText('');
    setErrorMessage(null);
  };

  const handleCustomAmountChange = (text: string) => {
    setCustomAmountText(text);
    setErrorMessage(null);
  };

  const handleStartCheckout = async () => {
    if (!student) {
      setErrorMessage('No se encontró el alumno para realizar la recarga.');
      return;
    }

    const amountCents = effectiveAmount * 100;

    // Validate with TopUpPreferenceRequestSchema
    const validation = TopUpPreferenceRequestSchema.safeParse({
      studentId: student.id,
      amountCents,
    });

    if (!validation.success) {
      setErrorMessage(validation.error.errors[0]?.message || 'El monto debe ser mayor a cero.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const res = await createTopUpPreferenceAction(
      {
        studentId: student.id,
        amountCents,
      },
      {
        auth: {
          role: 'PARENT',
          userId: parent?.id || student.parentId || student.id,
          institutionId,
        },
      }
    );

    setIsProcessing(false);

    if (!res.success || !res.preferenceId || !res.initPoint) {
      setErrorMessage(res.error || 'Error al conectar con la pasarela de pago.');
      return;
    }

    const isMock = res.preferenceId.startsWith('pref_');
    setPreferenceData({
      preferenceId: res.preferenceId,
      initPoint: res.initPoint,
      externalReference: res.externalReference,
      isMock,
    });
    setCheckoutModalVisible(true);

    if (!isMock) {
      await Linking.openURL(res.initPoint).catch(() => {
        setErrorMessage('No se pudo abrir el navegador. Tocá "Ir a Mercado Pago" abajo.');
      });
    }
  };

  const handleVerifyRealMercadoPagoPayment = useCallback(
    async (silentIfPending = false) => {
      if (!student || !preferenceData?.externalReference || isProcessing) return;

      setIsProcessing(true);
      if (!silentIfPending) {
        setErrorMessage(null);
      }

      const res = await verifyTopUpAction(
        {
          studentId: student.id,
          externalReference: preferenceData.externalReference,
          preferenceId: preferenceData.preferenceId,
        },
        {
          auth: {
            role: 'PARENT',
            userId: parent?.id || student.parentId || student.id,
            institutionId,
          },
        }
      );
      setIsProcessing(false);

      if (!res.success) {
        if (!silentIfPending) {
          setErrorMessage(res.error || 'Error al verificar el pago en Mercado Pago.');
        }
        return;
      }

      if (!res.verified || res.newBalanceArsCents === undefined) {
        if (!silentIfPending) {
          setErrorMessage(
            'Todavía no recibimos el pago aprobado desde Mercado Pago. Si acabás de pagar, esperá unos segundos y volvé a tocar Verificar.'
          );
        }
        return;
      }

      authStore.updateStudentFields(student.id, {
        balanceArsCents: res.newBalanceArsCents,
      });
      authStore.refreshCurrentStudent();

      setCheckoutModalVisible(false);
      setSuccessResult({
        newBalance: res.newBalanceArsCents / 100,
        amountLoaded: effectiveAmount,
      });
    },
    [student, preferenceData, isProcessing, parent?.id, institutionId, effectiveAmount]
  );

  useEffect(() => {
    if (!checkoutModalVisible || !preferenceData || preferenceData.isMock) return;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void handleVerifyRealMercadoPagoPayment(true);
      }
    });
    return () => subscription.remove();
  }, [checkoutModalVisible, preferenceData, handleVerifyRealMercadoPagoPayment]);

  const handleConfirmMercadoPagoPayment = async () => {
    if (!student || !preferenceData) return;

    setIsProcessing(true);
    const amountCents = effectiveAmount * 100;

    const res = await completeTopUpAction(
      {
        studentId: student.id,
        amountCents,
        preferenceId: preferenceData.preferenceId,
      },
      {
        auth: {
          role: 'PARENT',
          userId: parent?.id || student.parentId || student.id,
          institutionId,
        },
      }
    );
    setIsProcessing(false);

    if (!res.success || res.newBalanceArsCents === undefined) {
      setErrorMessage(res.error || 'No se pudo completar el pago.');
      return;
    }

    authStore.updateStudentFields(student.id, {
      balanceArsCents: res.newBalanceArsCents,
    });
    authStore.refreshCurrentStudent();

    setCheckoutModalVisible(false);
    setSuccessResult({
      newBalance: res.newBalanceArsCents / 100,
      amountLoaded: effectiveAmount,
    });
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      testID="screen-parent-top-up"
    >
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.replace('/(parent)')}
          style={styles.backButton}
          testID="btn-topup-back"
        >
          <ArrowLeft size={16} color={colors.brand.primary} />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <Pill
          label="Carga de Saldo 1 a 1"
          variant="mint"
          icon={<Banknote size={13} color={colors.economy.moneyMintDark} />}
        />
      </View>

      <Text style={styles.title}>Cargar Saldo Escolar</Text>
      <Text style={styles.subtitle}>
        Para {student?.fullName || 'tu hijo/a'} ({student?.grade || ''})
      </Text>

      {/* 1:1 Guarantee Banner */}
      <View style={styles.guaranteeBanner} testID="banner-one-to-one">
        <ShieldCheck size={28} color={colors.economy.moneyMintDark} />
        <View style={styles.guaranteeContent}>
          <Text style={styles.guaranteeTitle}>1 a 1 en Pesos Reales ARS</Text>
          <Text style={styles.guaranteeText}>
            $1 cargado = $1 en el kiosco. Sin comisiones de recarga, sin tokens ficticios ni criptomonedas.
          </Text>
        </View>
      </View>

      {/* Current Balance Overview */}
      <View style={styles.balanceCard} testID="card-current-balance">
        <Text style={styles.balanceLabel}>Saldo Actual Disponible</Text>
        <Text style={styles.balanceValue} testID="text-current-balance">
          ${studentBalanceArs}
        </Text>
      </View>

      {/* Preset Amount Selector */}
      <Text style={styles.sectionLabel}>Seleccioná un monto a cargar</Text>
      <View style={styles.presetsGrid} testID="presets-container">
        {PRESET_AMOUNTS.map((amount) => {
          const isSelected = selectedAmount === amount && !customAmountText.trim();
          return (
            <TouchableOpacity
              key={amount}
              onPress={() => handleSelectPreset(amount)}
              style={[styles.presetButton, isSelected && styles.presetButtonSelected]}
              testID={`btn-preset-${amount}`}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetText, isSelected && styles.presetTextSelected]}>
                ${amount.toLocaleString('es-AR')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom Amount Input */}
      <View style={styles.customAmountContainer}>
        <Text style={styles.customAmountLabel}>O ingresá otro monto:</Text>
        <View style={styles.inputRow}>
          <Text style={styles.currencyPrefix}>$</Text>
          <TextInput
            value={customAmountText}
            onChangeText={handleCustomAmountChange}
            placeholder="0"
            placeholderTextColor={colors.text.muted}
            keyboardType="numeric"
            style={styles.numericInput}
            testID="input-custom-amount"
          />
        </View>
      </View>

      {errorMessage && (
        <View style={styles.errorBox} testID="box-topup-error">
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Success View */}
      {successResult && (
        <View style={styles.successBox} testID="box-topup-success">
          <View style={styles.successTitleRow}>
            <CheckCircle2 size={20} color={colors.economy.moneyMintDark} />
            <Text style={styles.successTitle}>¡Carga Exitosa!</Text>
          </View>
          <Text style={styles.successText}>
            Acreditaste ${successResult.amountLoaded.toLocaleString('es-AR')} a la billetera de {student?.fullName}.
          </Text>
          <Text style={styles.newBalanceText}>
            Nuevo saldo: ${successResult.newBalance.toLocaleString('es-AR')}
          </Text>
          <Button
            label="Volver al Panel Tutor"
            onPress={() => router.replace('/(parent)')}
            variant="mint"
            style={styles.doneBtn}
            testID="btn-topup-done"
          />
        </View>
      )}

      {/* Checkout CTA */}
      {!successResult && (
        <View style={styles.ctaContainer}>
          <Button
            label={isProcessing ? 'Conectando...' : `Pagar $${effectiveAmount.toLocaleString('es-AR')} con Mercado Pago`}
            icon={<CreditCard size={18} color="#FFFFFF" />}
            onPress={handleStartCheckout}
            variant="primary"
            disabled={isProcessing || effectiveAmount <= 0}
            testID="btn-submit-topup"
          />
        </View>
      )}

      {/* Mercado Pago Checkout / Verification Sheet */}
      {checkoutModalVisible && preferenceData && (
        <View style={styles.checkoutModal} testID="modal-mp-checkout">
          <View style={styles.checkoutHeader}>
            <View style={styles.mpLogoRow}>
              <CreditCard size={18} color="#009EE3" />
              <Text style={styles.mpLogo}>Mercado Pago</Text>
            </View>
            <Text style={styles.checkoutTitle}>
              {preferenceData.isMock ? 'Checkout Simulado (Modo Demo)' : 'Checkout Sandbox / Real'}
            </Text>
          </View>
          <Text style={styles.checkoutSummary}>
            Recarga Billetera Escolar: ${effectiveAmount.toLocaleString('es-AR')} ARS
          </Text>
          <Text style={styles.checkoutSub}>
            Destinatario: {student?.fullName || 'Alumno'}
          </Text>
          <Text style={styles.checkoutSub}>
            Preferencia: {preferenceData.preferenceId}
          </Text>

          <View style={styles.checkoutActions}>
            {preferenceData.isMock ? (
              <Button
                label={isProcessing ? 'Procesando...' : 'Confirmar Pago Aprobado'}
                onPress={handleConfirmMercadoPagoPayment}
                variant="mint"
                disabled={isProcessing}
                testID="btn-confirm-mp-payment"
              />
            ) : (
              <>
                <Button
                  label={isProcessing ? 'Verificando pago...' : 'Ya pagué, verificar acreditación'}
                  icon={<CheckCircle2 size={18} color="#FFFFFF" />}
                  onPress={() => handleVerifyRealMercadoPagoPayment(false)}
                  variant="mint"
                  disabled={isProcessing}
                  testID="btn-verify-mp-payment"
                />
                <Button
                  label="Abrir Mercado Pago Nuevamente"
                  icon={<ExternalLink size={18} color="#FFFFFF" />}
                  onPress={() => Linking.openURL(preferenceData.initPoint)}
                  variant="primary"
                  style={{ marginTop: 8 }}
                  disabled={isProcessing}
                  testID="btn-reopen-mp-checkout"
                />
              </>
            )}
            <Button
              label="Cancelar"
              onPress={() => setCheckoutModalVisible(false)}
              variant="secondary"
              style={{ marginTop: 8 }}
              testID="btn-cancel-mp-payment"
            />
          </View>
        </View>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  guaranteeBanner: {
    flexDirection: 'row',
    backgroundColor: colors.economy.moneyMintSoft,
    borderWidth: 1.5,
    borderColor: colors.economy.moneyMint,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  guaranteeIcon: {
    fontSize: 28,
  },
  guaranteeContent: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.economy.moneyMintDark,
    marginBottom: 2,
  },
  guaranteeText: {
    fontSize: 13,
    color: colors.text.primary,
    lineHeight: 18,
  },
  balanceCard: {
    backgroundColor: colors.background.surface,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.brand.primaryDark,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  presetButton: {
    flex: 1,
    minWidth: '45%',
    height: 54,
    backgroundColor: colors.background.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.background.divider,
  },
  presetButtonSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primarySoft,
  },
  presetText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  presetTextSelected: {
    color: colors.brand.primaryDark,
  },
  customAmountContainer: {
    backgroundColor: colors.background.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  customAmountLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
  },
  numericInput: {
    flex: 1,
    height: 48,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: colors.status.danger,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.status.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: colors.economy.moneyMintSoft,
    borderWidth: 1.5,
    borderColor: colors.economy.moneyMint,
    padding: 20,
    borderRadius: 20,
    gap: 8,
    marginBottom: 20,
  },
  successTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.economy.moneyMintDark,
  },
  successText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  newBalanceText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.economy.moneyMintDark,
    marginTop: 4,
  },
  doneBtn: {
    marginTop: 12,
  },
  ctaContainer: {
    marginTop: 8,
  },
  checkoutModal: {
    backgroundColor: colors.background.surface,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    padding: 24,
    borderRadius: 24,
    marginTop: 20,
    gap: 10,
  },
  checkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mpLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mpLogo: {
    fontSize: 16,
    fontWeight: '800',
    color: '#009EE3',
  },
  checkoutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  checkoutSummary: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  checkoutSub: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  checkoutActions: {
    marginTop: 16,
  },
});
