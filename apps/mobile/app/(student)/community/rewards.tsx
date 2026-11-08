import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import {
  type SchoolRewardDto,
  SchoolRewardSchema,
  RedeemRewardSchema,
} from '@cambiazo/shared';
import { colors } from '../../../src/shared/theme/colors.js';
import { Pill } from '../../../src/shared/ui/Pill.js';
import { Button } from '../../../src/shared/ui/Button.js';
import { authStore, type AuthState } from '../../../src/shared/store/auth-store.js';
import { mockApiClient } from '../../../src/shared/api/mock-client.js';

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

  const student = authState.student || mockApiClient.getStudent('22222222-2222-4222-8222-222222222222');
  const institution = authState.institution || { id: 'e28bb18a-66fe-4f8e-9092-2df283f55001', name: 'Colegio Manuel Belgrano' };
  const studentId = student?.id || '22222222-2222-4222-8222-222222222222';
  const institutionId = student?.institutionId || institution.id;

  const loadRewards = async () => {
    const list = await mockApiClient.getSchoolRewards(institutionId);
    list.forEach((r) => SchoolRewardSchema.parse(r));
    setRewards(list);
    if (studentId) {
      authStore.refreshStudentFromClient(studentId);
    }
  };

  useEffect(() => {
    loadRewards();
  }, [institutionId, studentId]);

  const pointsCount = student?.communityPoints ?? 120;

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

    const res = await mockApiClient.redeemReward(validation.data);
    if (!res.success) {
      setErrorMessage(res.error || 'No se pudo completar el canje.');
      return;
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
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Pill label={`${pointsCount} Pts`} variant="neutral" icon="⭐" />
      </View>

      <Text style={styles.title}>Canjes Escolares</Text>
      <Text style={styles.subtitle}>
        Utilizá tus puntos solidarios para obtener reconocimientos en {institution.name}
      </Text>

      {/* Points Balance Banner */}
      <View style={styles.pointsBanner} testID="banner-rewards-balance">
        <Text style={styles.pointsLabel}>Tu Saldo de Puntos Disponibles</Text>
        <Text style={styles.pointsValue} testID="text-rewards-points-count">
          ⭐ {pointsCount} Puntos de Comunidad
        </Text>
        <Text style={styles.pointsNote}>
          🔒 Puntos no monetarios acumulados por trueques y donaciones escolares.
        </Text>
      </View>

      {redeemSuccessMessage ? (
        <View style={styles.successBanner} testID="banner-redeem-success">
          <Text style={styles.successIcon}>🎉</Text>
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
            <Text style={styles.emptyIcon}>🎁</Text>
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

            <View style={styles.modalDisclaimer}>
              <Text style={styles.modalDisclaimerText}>
                Al confirmar, se descontarán {selectedReward?.pointsCost} puntos de tu saldo comunitario.
              </Text>
            </View>

            <View style={styles.modalButtonsRow}>
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
  pointsValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.economy.pointsYellowDark,
    marginBottom: 4,
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
  successIcon: {
    fontSize: 28,
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
    paddingHorizontal: 10,
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
  emptyIcon: {
    fontSize: 40,
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
    paddingHorizontal: 20,
    lineHeight: 18,
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
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  modalError: {
    fontSize: 12,
    color: colors.status.danger,
    fontWeight: '600',
  },
  modalDisclaimer: {
    backgroundColor: colors.background.divider,
    padding: 12,
    borderRadius: 12,
  },
  modalDisclaimerText: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
});
