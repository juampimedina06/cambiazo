import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { type ExchangeMode } from '@cambiazo/shared';
import { colors } from '../../../src/shared/theme/colors';
import { Pill } from '../../../src/shared/ui/Pill';
import { Button } from '../../../src/shared/ui/Button';
import { authStore, type AuthState } from '../../../src/shared/store/auth-store';
import { mockApiClient, type MockExchangeItem } from '../../../src/shared/api/mock-client';

type FilterTab = 'ALL' | ExchangeMode;

export default function CommunityFeedScreen() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('ALL');
  const [items, setItems] = useState<MockExchangeItem[]>([]);

  useEffect(() => {
    return authStore.subscribe((state) => {
      setAuthState(state);
    });
  }, []);

  const student = authState.student || mockApiClient.getStudent('22222222-2222-4222-8222-222222222222');
  const institution = authState.institution || { id: 'e28bb18a-66fe-4f8e-9092-2df283f55001', name: 'Colegio Manuel Belgrano' };
  const institutionId = student?.institutionId || institution.id;

  const loadItems = () => {
    const filterArg = selectedFilter === 'ALL' ? undefined : selectedFilter;
    const feed = mockApiClient.getExchangeItems(institutionId, filterArg);
    setItems(feed);
  };

  useEffect(() => {
    loadItems();
  }, [institutionId, selectedFilter]);

  const pointsCount = student?.communityPoints ?? 120;

  const modeBadge = (mode: ExchangeMode) => {
    switch (mode) {
      case 'BARTER':
        return { label: 'Trueque', variant: 'primary' as const, icon: '🔄' };
      case 'DONATION':
        return { label: 'Donación', variant: 'mint' as const, icon: '🎁' };
      case 'LOAN':
        return { label: 'Préstamo', variant: 'neutral' as const, icon: '🤝' };
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      testID="screen-community-feed"
    >
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.replace('/(student)')}
          style={styles.backButton}
          testID="btn-community-back"
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>

        {/* Non-monetary Points Pill */}
        <TouchableOpacity
          onPress={() => router.push('/(student)/community/leaderboard')}
          activeOpacity={0.8}
        >
          <Pill label={`${pointsCount} Pts`} variant="neutral" icon="⭐" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Comunidad Escolar</Text>
      <Text style={styles.subtitle}>
        Útiles disponibles en {institution.name}
      </Text>

      {/* Moderated Pickup Notice Banner */}
      <View style={styles.moderationBanner} testID="banner-moderated-pickup">
        <Text style={styles.bannerIcon}>📍</Text>
        <View style={styles.bannerTextWrapper}>
          <Text style={styles.bannerTitle}>Punto de Entrega Escolar Moderado</Text>
          <Text style={styles.bannerSubtitle}>
            Todo intercambio, donación o préstamo se realiza y retira en el colegio bajo supervisión del equipo directivo.
          </Text>
        </View>
      </View>

      {/* Quick Action Navigation Buttons */}
      <View style={styles.quickActionsRow}>
        <Button
          label="+ Publicar Útil"
          onPress={() => router.push('/(student)/community/create')}
          variant="primary"
          style={{ flex: 1 }}
          testID="btn-community-create"
        />
        <Button
          label="🏆 Ranking"
          onPress={() => router.push('/(student)/community/leaderboard')}
          variant="secondary"
          style={{ flex: 1 }}
          testID="btn-community-leaderboard"
        />
        <Button
          label="🎁 Canjes"
          onPress={() => router.push('/(student)/community/rewards')}
          variant="mint"
          style={{ flex: 1 }}
          testID="btn-community-rewards"
        />
      </View>

      {/* Filter Tabs (ALL, BARTER, DONATION, LOAN) */}
      <View style={styles.filterTabsRow} testID="community-filter-tabs">
        {(['ALL', 'BARTER', 'DONATION', 'LOAN'] as const).map((tab) => {
          const isSelected = selectedFilter === tab;
          const label =
            tab === 'ALL'
              ? 'Todos'
              : tab === 'BARTER'
              ? '🔄 Trueque'
              : tab === 'DONATION'
              ? '🎁 Donación'
              : '🤝 Préstamo';

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, isSelected && styles.filterTabSelected]}
              onPress={() => setSelectedFilter(tab)}
              testID={`filter-tab-${tab.toLowerCase()}`}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isSelected && styles.filterTabTextSelected,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Feed Items (Flat on canvas, no card nesting, max 3 data points per row) */}
      <View style={styles.feedList} testID="community-items-list">
        {items.length === 0 ? (
          <View style={styles.emptyContainer} testID="empty-community-feed">
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No hay útiles en esta categoría</Text>
            <Text style={styles.emptySubtitle}>
              Sé el primero en publicar un útil escolar para compartir con tus compañeros de escuela.
            </Text>
          </View>
        ) : (
          items.map((item) => {
            const badge = modeBadge(item.mode);
            return (
              <View
                key={item.id}
                style={styles.itemRow}
                testID={`community-item-${item.id}`}
              >
                {/* 1. Icon / Avatar */}
                <View style={styles.itemIconCircle}>
                  <Text style={styles.itemIconText}>
                    {item.category === 'Libros'
                      ? '📖'
                      : item.category === 'Tecnología'
                      ? '🔢'
                      : item.category === 'Accesorios'
                      ? '🎒'
                      : '📐'}
                  </Text>
                </View>

                {/* 2. Short Title + Subtitle */}
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemSubtitle} numberOfLines={1}>
                    Por {item.studentAlias} • {item.category}
                  </Text>
                </View>

                {/* 3. Highlighted Badge / Mode on the right */}
                <Pill label={badge.label} variant={badge.variant} icon={badge.icon} />
              </View>
            );
          })
        )}
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
    marginBottom: 16,
  },
  moderationBanner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerIcon: {
    fontSize: 24,
  },
  bannerTextWrapper: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.background.surface,
  },
  filterTabSelected: {
    backgroundColor: colors.brand.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  filterTabTextSelected: {
    color: colors.text.inverse,
    fontWeight: '700',
  },
  feedList: {
    // Flat on canvas, no card-in-card
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.divider,
    gap: 12,
  },
  itemIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIconText: {
    fontSize: 22,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  itemSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
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
    paddingHorizontal: 24,
    lineHeight: 18,
  },
});
