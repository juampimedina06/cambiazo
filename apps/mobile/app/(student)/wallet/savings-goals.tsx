import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  PiggyBank,
  Lightbulb,
  Lock,
  Plus,
  Target,
  CheckCircle2,
  BookOpen,
  Utensils,
  Palette,
  Trophy,
  Briefcase,
  Pencil,
} from 'lucide-react-native';
import { colors } from '../../../src/shared/theme/colors';
import { Pill } from '../../../src/shared/ui/Pill';
import { Button } from '../../../src/shared/ui/Button';
import { NumericStepperField } from '../../../src/shared/ui/NumericStepperField';
import { authStore, resolveSessionContext, type AuthState } from '../../../src/shared/store/auth-store';
import {
  allocateToSavingsGoalAction,
  createSavingsGoalAction,
  fetchSavingsGoalsAction,
  fetchStudentBalanceAction,
  withdrawFromSavingsGoalAction,
  type SavingsGoal,
} from '../../../src/core';

interface GoalIconOption {
  key: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}

const GOAL_ICON_OPTIONS: GoalIconOption[] = [
  { key: 'target', label: 'Meta', Icon: Target },
  { key: 'book', label: 'Libros', Icon: BookOpen },
  { key: 'food', label: 'Almuerzo', Icon: Utensils },
  { key: 'art', label: 'Arte', Icon: Palette },
  { key: 'sport', label: 'Deporte', Icon: Trophy },
  { key: 'backpack', label: 'Mochila', Icon: Briefcase },
];

const renderGoalIcon = (iconKey?: string) => {
  switch (iconKey) {
    case 'book':
    case '📚':
      return <BookOpen size={22} color={colors.brand.primary} />;
    case 'food':
    case '🥪':
      return <Utensils size={22} color={colors.brand.primary} />;
    case 'art':
    case '🎨':
      return <Palette size={22} color={colors.brand.primary} />;
    case 'sport':
    case '⚽':
      return <Trophy size={22} color={colors.brand.primary} />;
    case 'backpack':
    case '🎒':
      return <Briefcase size={22} color={colors.brand.primary} />;
    case '📐':
      return <Pencil size={22} color={colors.brand.primary} />;
    case 'target':
    case '🎯':
    default:
      return <Target size={22} color={colors.brand.primary} />;
  }
};

export default function SavingsGoalsScreen() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  // Form states for creating goal
  const [newTitle, setNewTitle] = useState('');
  const [newTargetPesos, setNewTargetPesos] = useState('1500');
  const [newIcon, setNewIcon] = useState('target');
  const [createError, setCreateError] = useState('');

  // Form states for depositing to goal
  const [depositPesos, setDepositPesos] = useState('500');
  const [depositError, setDepositError] = useState('');

  useEffect(() => {
    return authStore.subscribe((state) => {
      setAuthState(state);
    });
  }, []);

  const { student, studentId, institutionId } = resolveSessionContext(authState);

  const reloadData = async () => {
    if (!studentId) return;
    const studentAuth = {
      role: 'STUDENT' as const,
      userId: studentId,
      institutionId,
    };
    const [list, balanceArsCents] = await Promise.all([
      fetchSavingsGoalsAction(studentId, { auth: studentAuth }),
      fetchStudentBalanceAction(studentId, { auth: studentAuth }).catch(() => student?.balanceArsCents ?? 0),
    ]);
    setGoals(list);
    authStore.updateStudentFields(studentId, { balanceArsCents });
  };

  useEffect(() => {
    reloadData();
  }, [studentId, institutionId]);

  const availableBalanceArs = ((student?.balanceArsCents ?? 0) / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const handleCreateGoal = async () => {
    setCreateError('');
    const targetCents = Math.round(parseFloat(newTargetPesos.replace(',', '.')) * 100);
    if (!newTitle.trim() || newTitle.trim().length < 2) {
      setCreateError('Ingresá un nombre para tu meta (mínimo 2 letras).');
      return;
    }
    if (isNaN(targetCents) || targetCents <= 0) {
      setCreateError('Ingresá un monto objetivo válido en pesos mayor a $0.');
      return;
    }

    const res = await createSavingsGoalAction(
      {
        studentId,
        title: newTitle.trim(),
        targetAmountCents: targetCents,
        icon: newIcon,
      },
      {
        auth: {
          role: 'STUDENT',
          userId: studentId,
          institutionId,
        },
      }
    );

    if (!res.success) {
      setCreateError(res.error || 'Error al crear la meta');
      return;
    }

    setShowCreateModal(false);
    setNewTitle('');
    setNewTargetPesos('1500');
    reloadData();
  };

  const handleDepositToGoal = async () => {
    if (!selectedGoal) return;
    setDepositError('');
    const amountCents = Math.round(parseFloat(depositPesos.replace(',', '.')) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      setDepositError('Ingresá un monto válido en pesos mayor a $0.');
      return;
    }

    const res = await allocateToSavingsGoalAction(
      {
        studentId,
        goalId: selectedGoal.id,
        amountCents,
      },
      {
        auth: {
          role: 'STUDENT',
          userId: studentId,
          institutionId,
        },
      }
    );
    if (!res.success) {
      setDepositError(res.error || 'Error al separar fondos');
      return;
    }

    setShowDepositModal(false);
    setDepositPesos('500');
    setSelectedGoal(null);
    reloadData();
  };

  const handleWithdrawFromGoal = async (goal: SavingsGoal) => {
    // Release all saved funds back to student's prepaid balance
    if (goal.savedAmountCents <= 0) return;
    const res = await withdrawFromSavingsGoalAction(
      {
        studentId,
        goalId: goal.id,
      },
      {
        auth: {
          role: 'STUDENT',
          userId: studentId,
          institutionId,
        },
      }
    );
    if (res.success) {
      reloadData();
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      testID="screen-savings-goals"
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.replace('/(student)')}
          style={styles.backButton}
          testID="btn-savings-back"
        >
          <ArrowLeft size={16} color={colors.brand.primary} />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <Pill
          label="Metas Educativas"
          variant="primary"
          icon={<PiggyBank size={13} color={colors.brand.primary} />}
        />
      </View>

      <Text style={styles.title}>Mis Alcancías</Text>
      <Text style={styles.subtitle}>
        Aprendé a organizar tus consumos y ahorrar para lo que más querés en el colegio.
      </Text>

      {/* Available Balance Surface */}
      <View style={styles.balanceSurface} testID="surface-available-balance">
        <Text style={styles.balanceLabel}>Saldo Disponible en Billetera Escolar</Text>
        <Text style={styles.balanceAmount} testID="text-savings-available-balance">
          ${availableBalanceArs}
        </Text>
        <View style={styles.balanceNoteRow}>
          <Lightbulb size={13} color={colors.text.muted} />
          <Text style={styles.balanceNote}>
            Podés separar dinero de tu saldo hacia tus metas en cualquier momento.
          </Text>
        </View>
      </View>

      {/* Invariant Educational Rule Banner */}
      <View style={styles.ruleBanner} testID="banner-educational-savings-rule">
        <Lock size={16} color={colors.brand.primaryDark} />
        <Text style={styles.ruleText}>
          Tus metas de ahorro son educativas y no alteran la regla institucional: el saldo solo se gasta dentro del kiosco escolar y no puede retirarse en efectivo ni transferirse.
        </Text>
      </View>

      {/* Action to create new goal */}
      <View style={styles.createBtnWrapper}>
        <Button
          label="Crear Nueva Meta de Ahorro"
          icon={<Plus size={16} color="#FFFFFF" />}
          onPress={() => setShowCreateModal(true)}
          variant="primary"
          testID="btn-open-create-goal"
        />
      </View>

      {/* List of Goals */}
      <View style={styles.goalsSection} testID="list-savings-goals">
        <Text style={styles.sectionTitle}>Tus Metas Activas</Text>

        {goals.length === 0 ? (
          <View style={styles.emptyContainer} testID="empty-savings-goals">
            <Target size={44} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>Todavía no tenés metas de ahorro</Text>
            <Text style={styles.emptySubtitle}>
              Creá tu primera alcancía para ahorrar para un libro, útiles especiales o un almuerzo saludable en el recreo.
            </Text>
          </View>
        ) : (
          goals.map((goal) => {
            const savedPesos = (goal.savedAmountCents / 100).toLocaleString('es-AR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            });
            const targetPesos = (goal.targetAmountCents / 100).toLocaleString('es-AR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            });
            const progressRatio = Math.min(1, goal.savedAmountCents / Math.max(1, goal.targetAmountCents));
            const progressPercent = Math.round(progressRatio * 100);
            const isCompleted = goal.savedAmountCents >= goal.targetAmountCents;

            return (
              <View
                key={goal.id}
                style={styles.goalSurface}
                testID={`goal-item-${goal.id}`}
              >
                <View style={styles.goalHeaderRow}>
                  <View style={styles.goalIconCircle}>
                    {renderGoalIcon(goal.icon)}
                  </View>
                  <View style={styles.goalTitleWrapper}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={styles.goalAmountsText}>
                      ${savedPesos} de ${targetPesos} ({progressPercent}%)
                    </Text>
                  </View>
                  {isCompleted && (
                    <Pill
                      label="¡Cumplida!"
                      variant="mint"
                      icon={<CheckCircle2 size={12} color={colors.economy.moneyMintDark} />}
                    />
                  )}
                </View>

                {/* Progress bar */}
                <View style={styles.goalProgressTrack}>
                  <View
                    style={[
                      styles.goalProgressFill,
                      {
                        width: `${progressPercent}%`,
                        backgroundColor: isCompleted ? colors.economy.moneyMint : colors.brand.primary,
                      },
                    ]}
                  />
                </View>

                {/* Action buttons */}
                <View style={styles.goalActionsRow}>
                  <TouchableOpacity
                    style={[styles.actionChip, styles.actionChipPrimary]}
                    onPress={() => {
                      setSelectedGoal(goal);
                      setDepositPesos('');
                      setDepositError('');
                      setShowDepositModal(true);
                    }}
                    testID={`btn-deposit-goal-${goal.id}`}
                  >
                    <Text style={styles.actionChipPrimaryText}>+ Ahorrar Saldo</Text>
                  </TouchableOpacity>

                  {goal.savedAmountCents > 0 && (
                    <TouchableOpacity
                      style={[styles.actionChip, styles.actionChipSecondary]}
                      onPress={() => handleWithdrawFromGoal(goal)}
                      testID={`btn-release-goal-${goal.id}`}
                    >
                      <Text style={styles.actionChipSecondaryText}>Liberar a Billetera</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* MODAL: CREATE GOAL */}
      <Modal visible={showCreateModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent} testID="modal-create-goal">
            <Text style={styles.modalTitle}>Nueva Meta de Ahorro</Text>
            <Text style={styles.modalSubtitle}>
              Fijá un objetivo para tus consumos escolares
            </Text>

            {createError ? <Text style={styles.errorText}>{createError}</Text> : null}

            <Text style={styles.fieldLabel}>Nombre de la meta</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Libro de Ciencias o Almuerzo Especial"
              placeholderTextColor={colors.text.muted}
              value={newTitle}
              onChangeText={setNewTitle}
              testID="input-goal-title"
            />

            <NumericStepperField
              label="Monto a alcanzar ($ ARS)"
              value={parseInt(newTargetPesos.replace(/\D/g, ''), 10) || 1500}
              onChange={(val) => setNewTargetPesos(String(val))}
              min={100}
              max={100000}
              step={500}
              prefix="$"
              presets={[1500, 2500, 5000, 10000]}
              allowDirectInput={true}
              testID="input-goal-target"
            />

            <Text style={styles.fieldLabel}>Elegí un ícono</Text>
            <View style={styles.iconsPickerRow}>
              {GOAL_ICON_OPTIONS.map((opt) => {
                const IconComp = opt.Icon;
                const isSelected = newIcon === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.iconPickBtn, isSelected && styles.iconPickBtnSelected]}
                    onPress={() => setNewIcon(opt.key)}
                  >
                    <IconComp
                      size={20}
                      color={isSelected ? colors.brand.primaryDark : colors.text.secondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalButtonsRow}>
              <Button
                label="Cancelar"
                onPress={() => setShowCreateModal(false)}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                label="Crear Meta"
                onPress={handleCreateGoal}
                variant="primary"
                style={{ flex: 1 }}
                testID="btn-confirm-create-goal"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: DEPOSIT TO GOAL */}
      <Modal visible={showDepositModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent} testID="modal-deposit-goal">
            <Text style={styles.modalTitle}>Ahorrar en {selectedGoal?.title}</Text>
            <Text style={styles.modalSubtitle}>
              Separá parte de tu saldo disponible (${availableBalanceArs} disponibles)
            </Text>

            {depositError ? <Text style={styles.errorText}>{depositError}</Text> : null}

            <NumericStepperField
              label="¿Cuánto querés separar hoy? ($ ARS)"
              value={parseInt(depositPesos.replace(/\D/g, ''), 10) || 500}
              onChange={(val) => setDepositPesos(String(val))}
              min={50}
              max={100000}
              step={100}
              prefix="$"
              presets={[200, 500, 1000, 2000]}
              allowDirectInput={true}
              testID="input-deposit-amount"
            />

            <View style={styles.modalButtonsRow}>
              <Button
                label="Cancelar"
                onPress={() => setShowDepositModal(false)}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                label="Confirmar"
                onPress={handleDepositToGoal}
                variant="mint"
                style={{ flex: 1 }}
                testID="btn-confirm-deposit-goal"
              />
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
    lineHeight: 18,
  },
  balanceSurface: {
    backgroundColor: colors.background.surface,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.brand.primaryDark,
    marginBottom: 6,
  },
  balanceNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceNote: {
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
  },
  ruleBanner: {
    flexDirection: 'row',
    backgroundColor: colors.brand.primarySoft,
    padding: 14,
    borderRadius: 16,
    gap: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  ruleText: {
    fontSize: 12,
    color: colors.brand.primaryDark,
    lineHeight: 16,
    flex: 1,
    fontWeight: '500',
  },
  createBtnWrapper: {
    marginBottom: 24,
  },
  goalsSection: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 8,
  },
  goalSurface: {
    backgroundColor: colors.background.surface,
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalTitleWrapper: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  goalAmountsText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '600',
    marginTop: 2,
  },
  goalProgressTrack: {
    height: 10,
    backgroundColor: colors.background.divider,
    borderRadius: 5,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  goalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  actionChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionChipPrimary: {
    backgroundColor: colors.brand.primarySoft,
  },
  actionChipPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  actionChipSecondary: {
    backgroundColor: colors.background.divider,
  },
  actionChipSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 27, 75, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 17,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.background.divider,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text.primary,
  },
  iconsPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  iconPickBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.background.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPickBtnSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primarySoft,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: colors.status.danger,
    fontWeight: '600',
  },
});
