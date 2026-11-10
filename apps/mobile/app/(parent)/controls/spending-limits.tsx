import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../../src/shared/theme/colors';
import { Button } from '../../../src/shared/ui/Button';
import { Pill } from '../../../src/shared/ui/Pill';
import { authStore, type AuthState } from '../../../src/shared/store/auth-store';
import { mockApiClient, type MockSpendingLimits } from '../../../src/shared/api/mock-client';
import { SpendingLimitsSchema, type ProductCategory } from '@cambiazo/shared';

interface CategoryOption {
  key: ProductCategory;
  label: string;
  emoji: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { key: 'CANDY', label: 'Golosinas', emoji: '🍬' },
  { key: 'DRINK', label: 'Bebidas', emoji: '🥤' },
  { key: 'HOT_MEAL', label: 'Comidas Calientes', emoji: '🥪' },
  { key: 'HEALTHY_SNACK', label: 'Snacks Saludables', emoji: '🍎' },
  { key: 'STATIONERY', label: 'Librería y Útiles', emoji: '✏️' },
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
      studentId,
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
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Pill label="Control Parental" variant="primary" icon="🛡️" />
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
          <Text style={styles.pauseEmoji}>{isPaused ? '🛑' : '🟢'}</Text>
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
          <Text style={styles.pauseToggleText}>
            {isPaused ? '▶️ Reactivar Cuenta Escolar' : '⏸️ Pausar Cuenta Inmediatamente'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Spending Limits Inputs */}
      <View style={styles.sectionSurface} testID="surface-spending-inputs">
        <Text style={styles.sectionTitle}>Topes de Gasto en Pesos (ARS)</Text>
        <Text style={styles.sectionHelp}>
          Topes de dinero que el alumno tiene permitido gastar en el kiosco.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tope de Gasto Diario ($ ARS)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              value={dailyLimitText}
              onChangeText={(text) => {
                setDailyLimitText(text);
                setSuccessMessage(null);
              }}
              keyboardType="numeric"
              placeholder="2000"
              style={styles.numericInput}
              testID="input-daily-limit"
            />
          </View>
          <Text style={styles.inputHint}>Monto máximo permitido por día de clases</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tope de Gasto Semanal ($ ARS)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              value={weeklyLimitText}
              onChangeText={(text) => {
                setWeeklyLimitText(text);
                setSuccessMessage(null);
              }}
              keyboardType="numeric"
              placeholder="10000"
              style={styles.numericInput}
              testID="input-weekly-limit"
            />
          </View>
          <Text style={styles.inputHint}>Monto acumulado máximo para los 5 días de la semana</Text>
        </View>
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
                <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.chipLabel,
                    isBlocked ? styles.chipLabelBlocked : styles.chipLabelAllowed,
                  ]}
                >
                  {cat.label}
                </Text>
                <Text style={styles.chipStatusIndicator}>
                  {isBlocked ? '🚫 Bloqueada' : '✅ Permitida'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Feedback Messages */}
      {errorMessage && (
        <View style={styles.errorBox} testID="box-limits-error">
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      )}

      {successMessage && (
        <View style={styles.successBox} testID="box-limits-success">
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
  chipEmoji: {
    fontSize: 20,
    marginRight: 10,
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
  chipStatusIndicator: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
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
