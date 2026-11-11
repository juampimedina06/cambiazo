import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Candy,
  CupSoda,
  Utensils,
  Apple,
  Pencil,
  Ban,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
} from 'lucide-react-native';
import { colors } from '../../../src/shared/theme/colors';
import { Button } from '../../../src/shared/ui/Button';
import { Pill } from '../../../src/shared/ui/Pill';
import { NumericStepperField } from '../../../src/shared/ui/NumericStepperField';
import { authStore, type AuthState } from '../../../src/shared/store/auth-store';
import { ensureUuid, mockApiClient, type MockSpendingLimits } from '../../../src/shared/api/mock-client';
import { SpendingLimitsSchema, type ProductCategory } from '@cambiazo/shared';

interface CategoryOption {
  key: ProductCategory;
  label: string;
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { key: 'CANDY', label: 'Golosinas', IconComponent: Candy },
  { key: 'DRINK', label: 'Bebidas', IconComponent: CupSoda },
  { key: 'HOT_MEAL', label: 'Comidas Calientes', IconComponent: Utensils },
  { key: 'HEALTHY_SNACK', label: 'Snacks Saludables', IconComponent: Apple },
  { key: 'STATIONERY', label: 'Librería y Útiles', IconComponent: Pencil },
];

export default function SpendingLimitsScreen() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());

  const student = authState.student || mockApiClient.getStudent('22222222-2222-4222-8222-222222222222');
  const studentId = student?.id || '22222222-2222-4222-8222-222222222222';

  const [dailyLimitText, setDailyLimitText] = useState<string>('2000');
  const [weeklyLimitText, setWeeklyLimitText] = useState<string>('10000');
  const [blockedCategories, setBlockedCategories] = useState<ProductCategory[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return authStore.subscribe((state) => {
      setAuthState(state);
    });
  }, []);

  useEffect(() => {
    if (studentId) {
      const currentLimits = mockApiClient.getSpendingLimits(studentId);
      setDailyLimitText((currentLimits.dailyLimitCents / 100).toString());
      setWeeklyLimitText((currentLimits.weeklyLimitCents / 100).toString());
      setBlockedCategories([...currentLimits.blockedCategories]);
      setIsPaused(currentLimits.isPaused);
    }
  }, [studentId]);

  const handleToggleCategory = (catKey: ProductCategory) => {
    setBlockedCategories((prev) => {
      if (prev.includes(catKey)) {
        return prev.filter((c) => c !== catKey);
      } else {
        return [...prev, catKey];
      }
    });
    setSuccessMessage(null);
  };

  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const dailyVal = parseInt(dailyLimitText.replace(/\D/g, ''), 10) || 0;
    const weeklyVal = parseInt(weeklyLimitText.replace(/\D/g, ''), 10) || 0;

    const payload = {
      studentId: ensureUuid(studentId),
      dailyLimitCents: dailyVal * 100,
      weeklyLimitCents: weeklyVal * 100,
      blockedCategories,
      isPaused,
    };

    // Validate with SpendingLimitsSchema
    const validation = SpendingLimitsSchema.safeParse(payload);
    if (!validation.success) {
      setErrorMessage(validation.error.errors[0]?.message || 'Límites inválidos');
      return;
    }

    setIsSaving(true);
    const res = await mockApiClient.updateSpendingLimits(payload);
    setIsSaving(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Error al guardar los límites.');
      return;
    }

    authStore.refreshCurrentStudent();
    setSuccessMessage('¡Límites y reglas actualizados correctamente!');
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      testID="screen-spending-limits"
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.replace('/(parent)')}
          style={styles.backButton}
          testID="btn-limits-back"
        >
          <ArrowLeft size={16} color={colors.brand.primary} />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <Pill
          label="Control Parental"
          variant="primary"
          icon={<Shield size={13} color={colors.brand.primary} />}
        />
      </View>

      <Text style={styles.title}>Límites y Controles</Text>
      <Text style={styles.subtitle}>
        Configurá los topes y restricciones de consumo para {student?.fullName || 'Mateo Gómez'}
      </Text>

      {/* High-Visibility Pause Toggle */}
      <View
        style={[
          styles.pauseCard,
          isPaused ? styles.pauseCardActive : styles.pauseCardInactive,
        ]}
        testID="card-pause-account"
      >
        <View style={styles.pauseHeader}>
          {isPaused ? (
            <ShieldAlert size={36} color={colors.status.danger} />
          ) : (
            <ShieldCheck size={36} color={colors.economy.moneyMintDark} />
          )}
          <View style={styles.pauseTextContainer}>
            <Text style={styles.pauseTitle}>
              {isPaused ? 'Cuenta Pausada' : 'Cuenta Activa'}
            </Text>
            <Text style={styles.pauseDescription}>
              {isPaused
                ? 'Todos los pagos en el kiosco escolar están bloqueados inmediatamente.'
                : 'El alumno puede realizar compras respetando los topes configurados.'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleTogglePause}
          style={[styles.pauseToggleButton, isPaused ? styles.btnReactivate : styles.btnPause]}
          testID="btn-toggle-pause"
          activeOpacity={0.8}
        >
          <View style={styles.pauseBtnContent}>
            {isPaused ? (
              <Play size={16} color={colors.text.inverse} fill={colors.text.inverse} />
            ) : (
              <Pause size={16} color={colors.text.inverse} fill={colors.text.inverse} />
            )}
            <Text style={styles.pauseToggleText}>
              {isPaused ? 'Reactivar Cuenta Escolar' : 'Pausar Cuenta Inmediatamente'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Spending Limits Inputs */}
      <View style={styles.sectionSurface} testID="surface-spending-inputs">
        <Text style={styles.sectionTitle}>Topes de Gasto en Pesos (ARS)</Text>
        <Text style={styles.sectionHelp}>
          Usá los botones + / − o elegí un monto rápido para fijar cuánto puede gastar por día y por semana.
        </Text>

        <NumericStepperField
          label="Tope de Gasto Diario ($ ARS)"
          value={parseInt(dailyLimitText.replace(/\D/g, ''), 10) || 0}
          onChange={(val) => {
            setDailyLimitText(String(val));
            setSuccessMessage(null);
          }}
          min={0}
          max={100000}
          step={500}
          prefix="$"
          presets={[1500, 2000, 3500, 5000]}
          allowDirectInput={true}
          helperText="Monto máximo permitido por día de clases"
          testID="input-daily-limit"
        />

        <NumericStepperField
          label="Tope de Gasto Semanal ($ ARS)"
          value={parseInt(weeklyLimitText.replace(/\D/g, ''), 10) || 0}
          onChange={(val) => {
            setWeeklyLimitText(String(val));
            setSuccessMessage(null);
          }}
          min={0}
          max={500000}
          step={1000}
          prefix="$"
          presets={[5000, 10000, 15000, 25000]}
          allowDirectInput={true}
          helperText="Monto acumulado máximo para los 5 días de la semana"
          testID="input-weekly-limit"
        />
      </View>

      {/* Emoji Category Blocking Chips */}
      <View style={styles.sectionSurface} testID="surface-category-blocking">
        <Text style={styles.sectionTitle}>Bloqueo de Categorías en Kiosco</Text>
        <Text style={styles.sectionHelp}>
          Tocá una categoría para bloquearla. Si el alumno intenta comprarla en el recreo, el cobro será rechazado automáticamente.
        </Text>

        <View style={styles.chipsContainer} testID="category-chips-container">
          {CATEGORY_OPTIONS.map((cat) => {
            const isBlocked = blockedCategories.includes(cat.key);
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => handleToggleCategory(cat.key)}
                style={[
                  styles.categoryChip,
                  isBlocked ? styles.categoryChipBlocked : styles.categoryChipAllowed,
                ]}
                testID={`chip-category-${cat.key}`}
                activeOpacity={0.7}
              >
                <View style={styles.chipLeft}>
                  <cat.IconComponent
                    size={20}
                    color={isBlocked ? colors.status.danger : colors.brand.primary}
                  />
                  <Text
                    style={[
                      styles.chipLabel,
                      isBlocked ? styles.chipLabelBlocked : styles.chipLabelAllowed,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </View>
                <View style={styles.chipStatusIndicatorWrapper}>
                  {isBlocked ? (
                    <>
                      <Ban size={13} color={colors.status.danger} />
                      <Text style={styles.chipStatusBlockedText}>Bloqueada</Text>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} color={colors.economy.moneyMintDark} />
                      <Text style={styles.chipStatusAllowedText}>Permitida</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Feedback Messages */}
      {errorMessage && (
        <View style={styles.errorBox} testID="box-limits-error">
          <AlertCircle size={16} color={colors.status.danger} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {successMessage && (
        <View style={styles.successBox} testID="box-limits-success">
          <CheckCircle2 size={16} color={colors.economy.moneyMintDark} />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <Button
          label={isSaving ? 'Guardando...' : 'Guardar Reglas y Límites'}
          onPress={handleSave}
          variant="primary"
          disabled={isSaving}
          testID="btn-save-spending-limits"
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
  pauseCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 2,
    gap: 16,
  },
  pauseCardInactive: {
    backgroundColor: '#F0FDF4',
    borderColor: colors.economy.moneyMint,
  },
  pauseCardActive: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.status.danger,
  },
  pauseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  pauseEmoji: {
    fontSize: 28,
  },
  pauseTextContainer: {
    flex: 1,
  },
  pauseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  pauseDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  pauseToggleButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPause: {
    backgroundColor: colors.status.danger,
  },
  btnReactivate: {
    backgroundColor: colors.economy.moneyMint,
  },
  pauseToggleText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.inverse,
  },
  sectionSurface: {
    backgroundColor: colors.background.surface,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  sectionHelp: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.canvas,
    borderWidth: 1.5,
    borderColor: colors.background.divider,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginRight: 6,
  },
  numericInput: {
    flex: 1,
    height: 48,
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  inputHint: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 4,
  },
  chipsContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  categoryChipAllowed: {
    backgroundColor: colors.brand.primarySoft,
    borderColor: '#DDD6FE',
  },
  categoryChipBlocked: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.status.danger,
  },
  chipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  chipLabelAllowed: {
    color: colors.brand.primaryDark,
  },
  chipLabelBlocked: {
    color: colors.status.danger,
    textDecorationLine: 'line-through',
  },
  chipStatusIndicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipStatusAllowedText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.economy.moneyMintDark,
  },
  chipStatusBlockedText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.status.danger,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.economy.moneyMintSoft,
    borderWidth: 1.5,
    borderColor: colors.economy.moneyMint,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  successText: {
    color: colors.economy.moneyMintDark,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveContainer: {
    marginTop: 8,
  },
});
