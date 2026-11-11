import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  ArrowLeft,
  Calendar,
  Lock,
  ShieldAlert,
  CheckCircle2,
  Star,
  Award,
  Sparkles,
  Apple,
  Utensils,
  CupSoda,
  Candy,
  Pencil,
  ShoppingBag,
} from 'lucide-react-native';
import {
  type WeeklyParentSummaryDto,
  WeeklyParentSummaryDtoSchema,
  type ProductCategory,
} from '@cambiazo/shared';
import { colors } from '../../../src/shared/theme/colors';
import { Pill } from '../../../src/shared/ui/Pill';
import { FlatListItem } from '../../../src/shared/ui/FlatListItem';
import { authStore, type AuthState } from '../../../src/shared/store/auth-store';
import { mockApiClient, type MockBlockedAttempt } from '../../../src/shared/api/mock-client';

const categoryIcons: Record<ProductCategory, React.ComponentType<{ size?: number; color?: string }>> = {
  HEALTHY_SNACK: Apple,
  HOT_MEAL: Utensils,
  DRINK: CupSoda,
  CANDY: Candy,
  STATIONERY: Pencil,
};

const categoryLabels: Record<ProductCategory, { label: string }> = {
  HEALTHY_SNACK: { label: 'Snacks Saludables' },
  HOT_MEAL: { label: 'Comida Caliente' },
  DRINK: { label: 'Bebidas' },
  CANDY: { label: 'Golosinas' },
  STATIONERY: { label: 'Librería y Útiles' },
};

export default function WeeklySummaryScreen() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());
  const [summary, setSummary] = useState<WeeklyParentSummaryDto | null>(null);
  const [blockedList, setBlockedList] = useState<MockBlockedAttempt[]>([]);

  useEffect(() => {
    return authStore.subscribe((state) => {
      setAuthState(state);
    });
  }, []);

  const student = authState.student || mockApiClient.getStudent('22222222-2222-4222-8222-222222222222');
  const studentId = student?.id || '22222222-2222-4222-8222-222222222222';

  useEffect(() => {
    if (studentId) {
      const data = mockApiClient.getWeeklyParentSummary(studentId);
      // Validate schema compliance
      const validated = WeeklyParentSummaryDtoSchema.parse(data);
      setSummary(validated);
      setBlockedList(mockApiClient.getBlockedAttempts(studentId));
    }
  }, [studentId]);

  if (!summary) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando resumen semanal...</Text>
      </View>
    );
  }

  const totalSpentFormatted = (summary.totalSpentCents / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      testID="screen-weekly-summary"
    >
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.replace('/(parent)')}
          style={styles.backButton}
          testID="btn-weekly-summary-back"
        >
          <ArrowLeft size={16} color={colors.brand.primary} />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <Pill
          label="Hábitos y Consumo"
          variant="primary"
          icon={<BarChart3 size={13} color={colors.brand.primary} />}
        />
      </View>

      <Text style={styles.title}>Resumen Semanal</Text>
      <Text style={styles.subtitle}>
        Seguimiento de consumos escolares de {student?.fullName || 'Mateo Gómez'}
      </Text>
      <View style={styles.dateRangeRow}>
        <Calendar size={14} color={colors.text.secondary} />
        <Text style={styles.dateRangeText}>
          Período: {summary.startDate} al {summary.endDate}
        </Text>
      </View>

      {/* 1. TOTAL SPENT SURFACE (Clean surface, no card-in-card) */}
      <View style={styles.totalSurface} testID="surface-total-spent">
        <Text style={styles.totalLabel}>Gasto Total en Kiosco (Pesos Reales)</Text>
        <Text style={styles.totalAmount} testID="text-total-spent-amount">
          ${totalSpentFormatted}
        </Text>
        <View style={styles.disclaimerRow}>
          <Lock size={12} color={colors.text.muted} />
          <Text style={styles.totalDisclaimer}>
            Saldo prepago 1 a 1 consumido exclusivamente dentro de la institución escolar.
          </Text>
        </View>
      </View>

      {/* 2. CATEGORY BREAKDOWN SECTION */}
      <View style={styles.sectionWrapper} testID="section-category-breakdown">
        <Text style={styles.sectionTitle}>Desglose por Categoría</Text>
        <Text style={styles.sectionSubtitle}>
          Monitoreá si tu hijo/a elige opciones saludables o golosinas en el recreo.
        </Text>

        <View style={styles.breakdownList}>
          {summary.breakdownByCategory.map((catItem) => {
            const CategoryIcon = categoryIcons[catItem.category] || ShoppingBag;
            const catLabel = categoryLabels[catItem.category]?.label || catItem.category;
            const amountFormatted = (catItem.amountCents / 100).toLocaleString('es-AR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            });

            return (
              <View
                key={catItem.category}
                style={styles.breakdownRow}
                testID={`breakdown-row-${catItem.category}`}
              >
                <View style={styles.breakdownHeaderRow}>
                  <View style={styles.categoryNameRow}>
                    <CategoryIcon size={16} color={colors.brand.primary} />
                    <Text style={styles.categoryName}>{catLabel}</Text>
                  </View>
                  <Text style={styles.categoryAmount}>
                    ${amountFormatted} ({catItem.percentage}%)
                  </Text>
                </View>

                {/* Progress bar representing category proportion */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${catItem.percentage}%`,
                        backgroundColor:
                          catItem.category === 'HEALTHY_SNACK'
                            ? colors.economy.moneyMint
                            : catItem.category === 'CANDY'
                            ? colors.status.warning
                            : colors.brand.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 3. BLOCKED PURCHASES ALERT SECTION */}
      <View style={styles.sectionWrapper} testID="section-blocked-attempts">
        <Text style={styles.sectionTitle}>Límites y Reglas Parentales</Text>

        {summary.blockedAttemptsCount > 0 ? (
          <View style={styles.alertBlockedBox} testID="alert-blocked-attempts">
            <View style={styles.alertBlockedTitleRow}>
              <ShieldAlert size={16} color={colors.status.danger} />
              <Text style={styles.alertBlockedTitle}>
                {summary.blockedAttemptsCount} intento(s) de compra frenado(s) esta semana
              </Text>
            </View>
            <Text style={styles.alertBlockedText}>
              Tus controles parentales protegieron la cuenta del alumno en el kiosco:
            </Text>
            {blockedList.map((item, index) => (
              <View key={item.id || `ba-${index}`} style={styles.blockedItemRow}>
                <Text style={styles.blockedBullet}>•</Text>
                <Text style={styles.blockedItemText}>
                  {item.reason} ({item.timestamp})
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.successBlockedBox} testID="box-zero-blocked-attempts">
            <View style={styles.successBlockedTitleRow}>
              <CheckCircle2 size={16} color={colors.economy.moneyMintDark} />
              <Text style={styles.successBlockedTitle}>
                Sin intentos rechazados esta semana
              </Text>
            </View>
            <Text style={styles.successBlockedText}>
              Todos los consumos en el kiosco se mantuvieron dentro de los límites y categorías permitidas.
            </Text>
          </View>
        )}
      </View>

      {/* 4. COMMUNITY IMPACT CARD (Non-monetary points & school solidarity) */}
      <View style={styles.communityImpactCard} testID="card-community-impact">
        <View style={styles.communityImpactHeader}>
          <View style={styles.communityBadgeRow}>
            <Star
              size={12}
              color={colors.economy.pointsYellowDark}
              fill={colors.economy.pointsYellow}
            />
            <Text style={styles.communityImpactBadge}>PUNTOS DE COMUNIDAD</Text>
          </View>
          <Text style={styles.communityImpactTitle}>Impacto Solidario Escolar</Text>
        </View>

        <Text style={styles.communityImpactPoints} testID="text-community-points-earned">
          +{summary.communityPointsEarned} Pts
        </Text>

        <Text style={styles.communityImpactExplanation}>
          Puntos solidarios acumulados por donar o intercambiar útiles en la escuela.
          (Estrictamente no monetarios ni canjeables por dinero).
        </Text>

        <View style={styles.badgesRow}>
          <Pill
            label="Gran Donante"
            variant="neutral"
            icon={<Award size={13} color={colors.brand.primary} />}
          />
          <Pill
            label="Primer Canje"
            variant="neutral"
            icon={<Sparkles size={13} color={colors.economy.pointsYellowDark} />}
          />
          <Pill
            label="Eco Alumno"
            variant="neutral"
            icon={<Sparkles size={13} color={colors.economy.moneyMintDark} />}
          />
        </View>
      </View>

      {/* 5. RECENT PURCHASES LIST (Flat on canvas, max 3 data points per item) */}
      <View style={styles.sectionWrapper} testID="section-recent-purchases">
        <Text style={styles.sectionTitle}>Detalle de Compras en el Kiosco</Text>

        <View style={styles.flatListWrapper} testID="weekly-purchases-flat-list">
          {summary.recentPurchases.length === 0 ? (
            <Text style={styles.emptyText}>No se registraron compras esta semana.</Text>
          ) : (
            summary.recentPurchases.map((purchase, index) => {
              const CategoryIcon = categoryIcons[purchase.category] || ShoppingBag;
              const amountFormatted = (purchase.amountCents / 100).toLocaleString('es-AR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              });

              return (
                <FlatListItem
                  key={purchase.id || `pur-${index}`}
                  icon={<CategoryIcon size={20} color={colors.brand.primary} />}
                  title={purchase.productName}
                  highlightValue={`-$${amountFormatted}`}
                  valueType="neutral"
                  testID={`weekly-purchase-item-${index}`}
                />
              );
            })
          )}
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 15,
    color: colors.text.secondary,
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
    marginBottom: 6,
  },
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dateRangeText: {
    fontSize: 13,
    color: colors.brand.primaryDark,
    fontWeight: '600',
  },
  totalSurface: {
    backgroundColor: colors.background.surface,
    padding: 22,
    borderRadius: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.brand.primaryDark,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  totalDisclaimer: {
    fontSize: 11,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionWrapper: {
    marginTop: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  breakdownList: {
    backgroundColor: colors.background.surface,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  breakdownRow: {
    gap: 6,
  },
  breakdownHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: colors.background.divider,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  alertBlockedBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: colors.status.warning,
    padding: 16,
    borderRadius: 16,
    gap: 6,
  },
  alertBlockedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertBlockedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9A3412',
  },
  alertBlockedText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  blockedItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingLeft: 4,
  },
  blockedBullet: {
    fontSize: 14,
    color: colors.status.warning,
    fontWeight: '800',
  },
  blockedItemText: {
    fontSize: 12,
    color: colors.text.primary,
    flex: 1,
  },
  successBlockedBox: {
    backgroundColor: colors.economy.moneyMintSoft,
    borderWidth: 1.5,
    borderColor: colors.economy.moneyMint,
    padding: 16,
    borderRadius: 16,
    gap: 4,
  },
  successBlockedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  successBlockedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.economy.moneyMintDark,
  },
  successBlockedText: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 17,
  },
  communityImpactCard: {
    backgroundColor: colors.economy.pointsYellowSoft,
    borderWidth: 1.5,
    borderColor: colors.economy.pointsYellow,
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  communityImpactHeader: {
    flexDirection: 'column',
    gap: 4,
    marginBottom: 6,
  },
  communityBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  communityImpactBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.economy.pointsYellowDark,
    letterSpacing: 0.5,
  },
  communityImpactTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.economy.pointsYellowDark,
  },
  communityImpactPoints: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.economy.pointsYellowDark,
    marginVertical: 4,
  },
  communityImpactExplanation: {
    fontSize: 12,
    color: '#854D0E',
    lineHeight: 16,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  flatListWrapper: {
    // Flat on canvas, zero card nesting
  },
  emptyText: {
    fontSize: 13,
    color: colors.text.secondary,
    paddingVertical: 12,
  },
});
