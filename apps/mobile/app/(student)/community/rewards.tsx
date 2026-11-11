import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Star,
  Lock,
  CheckCircle2,
  Gift,
} from 'lucide-react-native';
import {
  type SchoolRewardDto,
  SchoolRewardSchema,
  RedeemRewardSchema,
} from '@cambiazo/shared';
import { colors } from '../../../src/shared/theme/colors';
import { Pill } from '../../../src/shared/ui/Pill';
import { Button } from '../../../src/shared/ui/Button';
import { authStore, resolveSessionContext, type AuthState } from '../../../src/shared/store/auth-store';
import {
  fetchSchoolRewardsAction,
  redeemRewardAction,
} from '../../../src/core';

export default function RewardsCatalogScreen() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());
  const [rewards, setRewards] = useState<SchoolRewardDto[]>([]);
  const [selectedReward, setSelectedReward] = useState<SchoolRewardDto | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [redeemSuccessMessage, setRedeemSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    return authStore.subscribe((state) => {
      setAuthState(state);
    });
  }, []);

  const { student, studentId, institutionId, institutionName } = resolveSessionContext(authState);

  const loadRewards = async () => {
    if (!institutionId) {
      setRewards([]);
      return;
    }
    const list = await fetchSchoolRewardsAction(institutionId, {
      auth: {
        role: 'STUDENT',
        userId: studentId || undefined,
        institutionId,
      },
    });
    list.forEach((r) => SchoolRewardSchema.parse(r));
    setRewards(list);
  };

  useEffect(() => {
    loadRewards();
  }, [institutionId, studentId]);

  const pointsCount = student?.communityPoints ?? 0;

  const handleRedeem = async () => {
    if (!selectedReward) return;
    setErrorMessage('');

    const payload = {
      rewardId: selectedReward.id,
      studentId,
    };

    const validation = RedeemRewardSchema.safeParse(payload);
    if (!validation.success) {
      setErrorMessage(validation.error.errors[0]?.message || 'Datos de canje inválidos');
      return;
    }

    const res = await redeemRewardAction(validation.data, {
      auth: {
        role: 'STUDENT',
        userId: studentId,
        institutionId,
      },
    });
    if (!res.success) {
      setErrorMessage(res.error || 'No se pudo completar el canje.');
      return;
    }

    if (typeof res.remainingPoints === 'number' && studentId) {
      authStore.updateStudentFields(studentId, {
        communityPoints: res.remainingPoints,
      });
    }

    setShowConfirmModal(false);
    setRedeemSuccessMessage(
      `¡Canjeaste "${selectedReward.title}" con éxito! Acercate a Dirección o Secretaría escolar para retirar tu beneficio.`
    );
    setSelectedReward(null);
    await loadRewards();
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      testID="screen-community-rewards"
    >
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          testID="btn-rewards-back"
        >
          <ArrowLeft size={16} color={colors.brand.primary} />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <Pill
          label={`${pointsCount} Pts`}
          variant="neutral"
          icon={<Star size={13} color={colors.economy.pointsYellowDark} fill={colors.economy.pointsYellow} />}
        />
      </View>

      <Text style={styles.title}>Canjes Escolares</Text>
      <Text style={styles.subtitle}>
        Utilizá tus puntos solidarios para obtener reconocimientos en {institutionName}
      </Text>

      {/* Points Balance Banner */}
      <View style={styles.pointsBanner} testID="banner-rewards-balance">
        <Text style={styles.pointsLabel}>Tu Saldo de Puntos Disponibles</Text>
        <View style={styles.pointsValueRow}>
          <Star size={24} color={colors.economy.pointsYellowDark} fill={colors.economy.pointsYellow} />
          <Text style={styles.pointsValue} testID="text-rewards-points-count">
            {pointsCount} Puntos de Comunidad
          </Text>
        </View>
        <View style={styles.pointsNoteRow}>
          <Lock size={12} color="#854D0E" />
          <Text style={styles.pointsNote}>
            Puntos no monetarios acumulados por trueques y donaciones escolares.
          </Text>
        </View>
      </View>

      {redeemSuccessMessage ? (
        <View style={styles.successBanner} testID="banner-redeem-success">
          <CheckCircle2 size={32} color={colors.economy.moneyMintDark} />
          <View style={styles.successTextWrapper}>
            <Text style={styles.successTitle}>¡Canje Confirmado!</Text>
            <Text style={styles.successText}>{redeemSuccessMessage}</Text>
          </View>
        </View>
      ) : null}

      {/* Rewards Catalog List */}
      <View style={styles.rewardsList} testID="list-school-rewards">
        <Text style={styles.sectionTitle}>Beneficios Disponibles</Text>

        {rewards.length === 0 ? (
          <View style={styles.emptyContainer} testID="empty-rewards-catalog">
            <Gift size={44} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>No hay recompensas activas</Text>
            <Text style={styles.emptySubtitle}>
              Próximamente la institución habilitará nuevos reconocimientos escolares.
            </Text>
          </View>
        ) : (
          rewards.map((reward) => {
            const canAfford = pointsCount >= reward.pointsCost;
            const hasStock = reward.stock === undefined || reward.stock > 0;

            return (
              <View
                key={reward.id}
                style={styles.rewardSurface}
                testID={`reward-item-${reward.id}`}
              >
                <View style={styles.rewardHeaderRow}>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={styles.rewardDesc}>{reward.description}</Text>
                    {reward.stock !== undefined && (
                      <Text style={styles.rewardStock}>
                        Stock disponible: {reward.stock} unidad(es)
                      </Text>
                    )}
                  </View>
                  <View style={styles.costBadge}>
                    <Text style={styles.costText}>{reward.pointsCost} Pts</Text>
                  </View>
                </View>

                {/* Redeem Button */}
                <Button
                  label={
                    !hasStock
                      ? 'Sin Stock'
                      : canAfford
                      ? `Canjear por ${reward.pointsCost} Pts`
                      : `Te faltan ${reward.pointsCost - pointsCount} Pts`
                  }
                  onPress={() => {
                    if (canAfford && hasStock) {
                      setSelectedReward(reward);
                      setErrorMessage('');
                      setShowConfirmModal(true);
                    }
                  }}
                  variant={canAfford && hasStock ? 'mint' : 'secondary'}
                  disabled={!canAfford || !hasStock}
                  testID={`btn-redeem-${reward.id}`}
                />
              </View>
            );
          })
        )}
      </View>

      {/* MODAL: CONFIRM REDEEM */}
      <Modal visible={showConfirmModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent} testID="modal-confirm-redeem">
            <Text style={styles.modalTitle}>Confirmar Canje Escolar</Text>
            <Text style={styles.modalSubtitle}>
              ¿Querés canjear "{selectedReward?.title}" por {selectedReward?.pointsCost} Puntos de Comunidad?
            </Text>

            {errorMessage ? (
              <Text style={styles.modalError}>{errorMessage}</Text>
            ) : null}

            <View style={styles.modalActionsRow}>
              <Button
                label="Cancelar"
                onPress={() => setShowConfirmModal(false)}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                label="Confirmar Canje"
                onPress={handleRedeem}
                variant="mint"
                style={{ flex: 1 }}
                testID="btn-confirm-redeem"
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
  },
  pointsBanner: {
    backgroundColor: colors.economy.pointsYellowSoft,
    borderWidth: 1.5,
    borderColor: colors.economy.pointsYellow,
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  pointsLabel: {
    fontSize: 12,
    color: colors.economy.pointsYellowDark,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pointsValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.economy.pointsYellowDark,
  },
  pointsNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  pointsNote: {
    fontSize: 11,
    color: '#854D0E',
    textAlign: 'center',
  },
  successBanner: {
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
  successTextWrapper: {
    flex: 1,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.economy.moneyMintDark,
    marginBottom: 2,
  },
  successText: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  rewardsList: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  rewardSurface: {
    backgroundColor: colors.background.surface,
    padding: 18,
    borderRadius: 20,
    gap: 14,
  },
  rewardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  rewardDesc: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
  rewardStock: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 6,
    fontWeight: '500',
  },
  costBadge: {
    backgroundColor: colors.economy.pointsYellowSoft,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.economy.pointsYellow,
  },
  costText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.economy.pointsYellowDark,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
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
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.background.surface,
    padding: 24,
    borderRadius: 24,
    width: '100%',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  modalError: {
    backgroundColor: '#FEF2F2',
    color: colors.status.danger,
    padding: 10,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
});
