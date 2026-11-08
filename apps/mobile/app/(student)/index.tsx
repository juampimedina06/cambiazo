import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/shared/theme/colors.js';
import { Button } from '../../src/shared/ui/Button.js';
import { FlatListItem } from '../../src/shared/ui/FlatListItem.js';
import { StudentHeader } from '../../src/entities/student-profile/ui/StudentHeader.js';
import { authStore, type AuthState } from '../../src/shared/store/auth-store.js';
import { mockApiClient } from '../../src/shared/api/mock-client.js';

export default function StudentHomeScreen() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());

  useEffect(() => {
    return authStore.subscribe((state) => {
      setAuthState(state);
    });
  }, []);

  const student = authState.student || mockApiClient.getStudent('22222222-2222-4222-8222-222222222222');
  const institutionName = authState.institution?.name || 'Colegio Manuel Belgrano';

  const spendingLimits = student ? mockApiClient.getSpendingLimits(student.id) : null;
  const isPaused = spendingLimits?.isPaused ?? false;
  const dailyLimitCents = spendingLimits?.dailyLimitCents ?? (student?.dailyLimitCents ?? 200000);

  // Money formatting helper (Pesos Reales 1 a 1, ARS, NO tokens/coins)
  const balanceArs = ((student?.balanceArsCents ?? 450000) / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const dailySpentArs = ((student?.dailySpentCents ?? 50000) / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const dailyLimitArs = (dailyLimitCents / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // Calculate daily limit progress percentage
  const spentRatio = Math.min(1, (student?.dailySpentCents ?? 50000) / Math.max(1, dailyLimitCents));

  const recentPurchases = student ? mockApiClient.getPurchases(student.id).slice(0, 3) : [];

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      testID="screen-student-home"
    >
      {/* 1. HEADER: Saludo + Badge Escuela + Píldora amarilla con Puntos */}
      <StudentHeader
        fullName={student?.fullName || 'Mateo Gómez'}
        institutionName={institutionName}
        communityPoints={student?.communityPoints ?? 120}
      />

      {/* Paused Account Alert */}
      {isPaused && (
        <View style={styles.pausedBanner} testID="banner-student-account-paused">
          <Text style={styles.pausedIcon}>⏸️</Text>
          <View style={styles.pausedTextWrapper}>
            <Text style={styles.pausedTitle}>Cuenta Pausada por tu Tutor</Text>
            <Text style={styles.pausedSubtitle}>
              Los pagos en el recreo están temporalmente pausados. Pedile a tu tutor que reactive tu cuenta desde su panel.
            </Text>
          </View>
        </View>
      )}

      {/* 2. SUPERFICIE CENTRAL LIMPIA: Saldo gigante en pesos + barra + Botón QR */}
      <View style={styles.walletSurface} testID="student-wallet-surface">
        <Text style={styles.walletLabel}>Tu Saldo Disponible en Kiosco</Text>
        <Text style={styles.walletBalance} testID="student-balance-text">
          ${balanceArs}
        </Text>

        {/* Daily limit indicator */}
        <View style={styles.limitContainer}>
          <View style={styles.limitHeaderRow}>
            <Text style={styles.limitLabel}>Límite diario de hoy</Text>
            <Text style={styles.limitValue}>
              ${dailySpentArs} / ${dailyLimitArs}
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${Math.round(spentRatio * 100)}%` }]} />
          </View>
        </View>

        {/* Protagonist touch button (56px height, rounded-2xl) */}
        <Button
          label={isPaused ? 'Pagos Pausados por Tutor' : 'Pagar en Kiosco (QR)'}
          onPress={() => {
            if (!isPaused) {
              router.push('/(student)/pay-qr');
            }
          }}
          variant="primary"
          disabled={isPaused}
          style={styles.qrButton}
          testID="btn-pay-qr"
        />

        {/* Prohibited Transfers/Withdrawals Rule */}
        <View style={styles.prohibitedRuleBox} testID="rule-no-transfer-withdraw">
          <Text style={styles.prohibitedRuleText}>
            🔒 Saldo exclusivo para consumos escolares. Prohibido transferir saldo o retirar efectivo.
          </Text>
        </View>
      </View>

      {/* 3. SECCIÓN INFERIOR: Lista plana de últimos 3 consumos (NO CARD-IN-CARD, MAX 3 DATOS) */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Últimos Consumos</Text>

        <View style={styles.flatListWrapper} testID="recent-consumptions-list">
          {recentPurchases.length === 0 ? (
            <Text style={styles.emptyRecentText}>No registrás consumos recientes en el recreo.</Text>
          ) : (
            recentPurchases.map((purchase, index) => {
              const amountFormatted = ((purchase.amountCents) / 100).toLocaleString('es-AR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              });
              return (
                <FlatListItem
                  key={purchase.id || `rec-${index}`}
                  icon={purchase.icon || '🛍️'}
                  title={purchase.itemsSummary}
                  highlightValue={`-$${amountFormatted}`}
                  valueType="neutral"
                  testID={`item-consumption-${index + 1}`}
                />
              );
            })
          )}
        </View>
      </View>

      {/* 4. MODULOS ESTUDIANTILES: METAS Y COMUNIDAD DE INTERCAMBIO */}
      <View style={styles.modulesSection} testID="student-modules-section">
        <Text style={styles.sectionTitle}>Comunidad y Educación Financiera</Text>
        <View style={styles.modulesGrid}>
          <Button
            label="🐖 Mis Metas de Ahorro"
            onPress={() => router.push('/(student)/wallet/savings-goals')}
            variant="mint"
            testID="btn-student-savings-goals"
          />
          <Button
            label="🤝 Comunidad de Intercambio Escolar"
            onPress={() => router.push('/(student)/community')}
            variant="primary"
            testID="btn-student-community"
          />
        </View>
      </View>

      {/* 5. RETURN TO PARENT PANEL (For developer/user testing flow) */}
      <View style={styles.footerNav}>
        <Button
          label="Volver al Panel Tutor"
          onPress={() => {
            router.replace('/(parent)');
          }}
          variant="secondary"
          testID="btn-back-to-parent"
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
  walletSurface: {
    backgroundColor: colors.background.surface,
    padding: 24,
    borderRadius: 24,
    marginTop: 16,
    alignItems: 'center',
  },
  walletLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  walletBalance: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.brand.primaryDark,
    letterSpacing: -1,
    marginBottom: 20,
  },
  limitContainer: {
    width: '100%',
    marginBottom: 24,
  },
  limitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  limitValue: {
    fontSize: 13,
    color: colors.text.primary,
    fontWeight: '700',
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background.divider,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.economy.moneyMint,
    borderRadius: 4,
  },
  qrButton: {
    width: '100%',
    minHeight: 56,
  },
  pausedBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: colors.status.danger,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  pausedIcon: {
    fontSize: 26,
  },
  pausedTextWrapper: {
    flex: 1,
  },
  pausedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.status.danger,
    marginBottom: 2,
  },
  pausedSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  prohibitedRuleBox: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.background.divider,
    width: '100%',
  },
  prohibitedRuleText: {
    fontSize: 11,
    color: colors.text.muted,
    textAlign: 'center',
    fontWeight: '600',
  },
  recentSection: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 12,
  },
  flatListWrapper: {
    // Flat on canvas, separated by dividers, zero nested cards
  },
  emptyRecentText: {
    fontSize: 13,
    color: colors.text.secondary,
    paddingVertical: 12,
  },
  modulesSection: {
    marginTop: 28,
  },
  modulesGrid: {
    gap: 12,
  },
  footerNav: {
    marginTop: 32,
  },
});
