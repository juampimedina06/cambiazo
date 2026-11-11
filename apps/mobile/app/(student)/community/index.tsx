import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Star,
  MapPin,
  Plus,
  Trophy,
  Gift,
  RefreshCw,
  Handshake,
  BookOpen,
  Cpu,
  Briefcase,
  Pencil,
  PackageOpen,
} from 'lucide-react-native';
import { type ExchangeMode } from '@cambiazo/shared';
import { colors } from '../../../src/shared/theme/colors';
import { Pill } from '../../../src/shared/ui/Pill';
import { Button } from '../../../src/shared/ui/Button';
import { authStore, resolveSessionContext, type AuthState } from '../../../src/shared/store/auth-store';
import { fetchExchangeItemsAction, type ExchangeItem } from '../../../src/core';

type FilterTab = 'ALL' | ExchangeMode;

const renderCategoryIcon = (category: string) => {
  switch (category) {
    case 'Libros':
      return <BookOpen size={20} color={colors.brand.primary} />;
    case 'Tecnología':
      return <Cpu size={20} color={colors.brand.primary} />;
    case 'Accesorios':
      return <Briefcase size={20} color={colors.brand.primary} />;
    default:
      return <Pencil size={20} color={colors.brand.primary} />;
  }
};

export default function CommunityFeedScreen() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('ALL');
  const [items, setItems] = useState<ExchangeItem[]>([]);

  useEffect(() => {
    return authStore.subscribe((state) => {
      setAuthState(state);
    });
  }, []);

  const { student, studentId, institutionId, institutionName } = resolveSessionContext(authState);

  const loadItems = async () => {
    if (!institutionId) {
      setItems([]);
      return;
    }
    const filterArg = selectedFilter === 'ALL' ? undefined : selectedFilter;
    const feed = await fetchExchangeItemsAction(institutionId, filterArg, {
      auth: {
        role: 'STUDENT',
        userId: studentId || undefined,
        institutionId,
      },
    });
    setItems(feed);
  };

  useEffect(() => {
    loadItems();
  }, [institutionId, selectedFilter]);

  const pointsCount = student?.communityPoints ?? 0;

  const modeBadge = (mode: ExchangeMode) => {
    switch (mode) {
      case 'BARTER':
        return {
          label: 'Trueque',
          variant: 'primary' as const,
          icon: <RefreshCw size={11} color={colors.brand.primaryDark} />,
        };
      case 'DONATION':
        return {
          label: 'Donación',
          variant: 'mint' as const,
          icon: <Gift size={11} color={colors.economy.moneyMintDark} />,
        };
      case 'LOAN':
        return {
          label: 'Préstamo',
          variant: 'neutral' as const,
          icon: <Handshake size={11} color={colors.text.secondary} />,
        };
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
          <ArrowLeft size={16} color={colors.brand.primary} />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>

        {/* Non-monetary Points Pill */}
        <TouchableOpacity
          onPress={() => router.push('/(student)/community/leaderboard')}
          activeOpacity={0.8}
        >
          <Pill
            label={`${pointsCount} Pts`}
            variant="neutral"
            icon={<Star size={13} color={colors.economy.pointsYellowDark} fill={colors.economy.pointsYellow} />}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Comunidad Escolar</Text>
      <Text style={styles.subtitle}>
        Útiles disponibles en {institutionName}
      </Text>

      {/* Moderated Pickup Notice Banner */}
      <View style={styles.moderationBanner} testID="banner-moderated-pickup">
        <MapPin size={22} color="#2563EB" />
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
          label="Publicar Útil"
          icon={<Plus size={16} color="#FFFFFF" />}
          onPress={() => router.push('/(student)/community/create')}
          variant="primary"
          style={{ flex: 1 }}
          testID="btn-community-create"
        />
        <Button
          label="Ranking"
          icon={<Trophy size={16} color={colors.brand.primaryDark} />}
          onPress={() => router.push('/(student)/community/leaderboard')}
          variant="secondary"
          style={{ flex: 1 }}
          testID="btn-community-leaderboard"
        />
        <Button
          label="Canjes"
          icon={<Gift size={16} color="#FFFFFF" />}
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
              ? 'Trueques'
              : tab === 'DONATION'
              ? 'Donaciones'
              : 'Préstamos';

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
            <PackageOpen size={44} color={colors.text.muted} />
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
                  {renderCategoryIcon(item.category)}
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
