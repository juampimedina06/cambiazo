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

  // Money formatting helper (Pesos Reales 1 a 1, ARS, NO tokens/coins)
  const balanceArs = ((student?.balanceArsCents ?? 450000) / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const dailySpentArs = ((student?.dailySpentCents ?? 50000) / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const dailyLimitArs = ((student?.dailyLimitCents ?? 200000) / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // Calculate daily limit progress percentage
  const spentRatio = Math.min(
    1,
    (student?.dailySpentCents ?? 50000) / (student?.dailyLimitCents ?? 200000)
  );

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

      {/* 2. SUPERFICIE CENTRAL LIMPIA: Saldo gigante en pesos + barra + Botón QR */}
      <View style={styles.walletSurface} testID="student-wallet-surface">
        <Text style={styles.walletLabel}>Tu Saldo Disponible</Text>
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

        {/* Protagonist touch button (min 54px height, rounded-2xl) */}
        <Button
          label="Pagar en Kiosco (QR)"
          onPress={() => {
            // QR payment trigger
          }}
          variant="primary"
          style={styles.qrButton}
          testID="btn-pay-qr"
        />
      </View>

      {/* 3. SECCIÓN INFERIOR: Lista plana de últimos 3 consumos (NO CARD-IN-CARD, MAX 3 DATOS) */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Últimos Consumos</Text>

        <View style={styles.flatListWrapper} testID="recent-consumptions-list">
          <FlatListItem
            icon="🥪"
            title="Tostado de Jamón y Queso"
            highlightValue="-$1.800"
            valueType="neutral"
            testID="item-consumption-1"
          />
          <FlatListItem
            icon="🧃"
            title="Jugo de Naranja 250ml"
            highlightValue="-$900"
            valueType="neutral"
            testID="item-consumption-2"
          />
          <FlatListItem
            icon="🍎"
            title="Manzana Roja"
            highlightValue="-$600"
            valueType="neutral"
            testID="item-consumption-3"
          />
        </View>
      </View>

      {/* 4. RETURN TO PARENT PANEL (For developer/user testing flow) */}
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
  footerNav: {
    marginTop: 32,
  },
});
