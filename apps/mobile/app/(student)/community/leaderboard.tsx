import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Trophy,
  Star,
  Lock,
  Award,
  Handshake,
  Leaf,
  Gift,
} from 'lucide-react-native';
import {
  type LeaderboardEntryDto,
  LeaderboardEntryDtoSchema,
} from '@cambiazo/shared';
import { colors } from '../../../src/shared/theme/colors';
import { Pill } from '../../../src/shared/ui/Pill';
import { Button } from '../../../src/shared/ui/Button';
import { authStore, type AuthState } from '../../../src/shared/store/auth-store';
import { mockApiClient } from '../../../src/shared/api/mock-client';

export default function LeaderboardScreen() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());
  const [entries, setEntries] = useState<LeaderboardEntryDto[]>([]);

  useEffect(() => {
    return authStore.subscribe((state) => {
      setAuthState(state);
    });
  }, []);

  const student = authState.student || mockApiClient.getStudent('22222222-2222-4222-8222-222222222222');
  const institution = authState.institution || { id: 'e28bb18a-66fe-4f8e-9092-2df283f55001', name: 'Colegio Manuel Belgrano' };
  const studentId = student?.id || '22222222-2222-4222-8222-222222222222';
  const institutionId = student?.institutionId || institution.id;

  useEffect(() => {
    const fetchRanking = async () => {
      const data = await mockApiClient.getLeaderboard(institutionId);
      // Validate schema compliance
      data.forEach((e) => LeaderboardEntryDtoSchema.parse(e));
      setEntries(data);
    };
    fetchRanking();
  }, [institutionId]);

  const pointsCount = student?.communityPoints ?? 120;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      testID="screen-community-leaderboard"
    >
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.replace('/(student)/community')}
          style={styles.backButton}
          testID="btn-leaderboard-back"
        >
          <ArrowLeft size={16} color={colors.brand.primary} />
          <Text style={styles.backButtonText}>Comunidad</Text>
        </TouchableOpacity>
        <Pill
          label="Ranking Solidario"
          variant="neutral"
          icon={<Trophy size={13} color={colors.brand.primaryDark} />}
        />
      </View>

      <Text style={styles.title}>Mis Puntos y Ranking</Text>
      <Text style={styles.subtitle}>
        Reconocimiento al compromiso solidario en {institution.name}
      </Text>

      {/* Points Surface (Strictly non-monetary community points) */}
      <View style={styles.pointsSurface} testID="surface-community-points">
        <Text style={styles.pointsLabel}>Tus Puntos de Comunidad</Text>
        <View style={styles.pointsRow}>
          <Star size={28} color={colors.economy.pointsYellowDark} fill={colors.economy.pointsYellow} />
          <Text style={styles.pointsValue} testID="text-my-community-points">
            {pointsCount} Pts
          </Text>
        </View>
        <View style={styles.nonMonetaryBox} testID="banner-non-monetary-points">
          <Lock size={12} color="#854D0E" />
          <Text style={styles.nonMonetaryText}>
            Puntos solidarios no monetarios. No tienen valor en dinero ni son canjeables por pesos en efectivo.
          </Text>
        </View>
      </View>

      {/* Badges Section */}
      <View style={styles.badgesSection} testID="section-unlocked-badges">
        <Text style={styles.sectionTitle}>Tus Medallas Desbloqueadas</Text>
        <View style={styles.badgesGrid}>
          <View style={styles.badgeCard}>
            <View style={styles.badgeIconCircle}>
              <Award size={22} color={colors.brand.primary} />
            </View>
            <Text style={styles.badgeName}>Gran Donante</Text>
            <Text style={styles.badgeDesc}>Donaste útiles al colegio</Text>
          </View>
          <View style={styles.badgeCard}>
            <View style={styles.badgeIconCircle}>
              <Handshake size={22} color={colors.economy.moneyMintDark} />
            </View>
            <Text style={styles.badgeName}>Primer Canje</Text>
            <Text style={styles.badgeDesc}>Completaste un intercambio</Text>
          </View>
          <View style={styles.badgeCard}>
            <View style={styles.badgeIconCircle}>
              <Leaf size={22} color={colors.economy.moneyMint} />
            </View>
            <Text style={styles.badgeName}>Eco Alumno</Text>
            <Text style={styles.badgeDesc}>Cuidado del medio ambiente</Text>
          </View>
        </View>
      </View>

      {/* School Leaderboard List */}
      <View style={styles.leaderboardSection} testID="section-leaderboard-table">
        <Text style={styles.sectionTitle}>Tabla de Posiciones Escolar</Text>
        <Text style={styles.sectionSubtitle}>
          Los alumnos más solidarios de tu institución este ciclo lectivo
        </Text>

        <View style={styles.leaderboardList}>
          {entries.map((entry) => {
            const isMe = entry.studentId === studentId;
            return (
              <View
                key={entry.studentId}
                style={[styles.leaderboardRow, isMe && styles.leaderboardRowActive]}
                testID={`leaderboard-entry-${entry.rank}`}
              >
                {/* Rank number */}
                <View style={[styles.rankCircle, isMe && styles.rankCircleActive]}>
                  <Text style={[styles.rankText, isMe && styles.rankTextActive]}>
                    #{entry.rank}
                  </Text>
                </View>

                {/* Student Alias & Badges */}
                <View style={styles.entryInfo}>
                  <View style={styles.entryNameRow}>
                    <Text style={styles.entryAlias}>
                      {entry.studentAlias} {isMe ? '(Vos)' : ''}
                    </Text>
                    {isMe && <Pill label="Tu Posición" variant="primary" />}
                  </View>
                  <Text style={styles.entryBadges}>
                    {entry.badges.join(' • ')}
                  </Text>
                </View>

                {/* Accumulated Points on Right */}
                <Text style={styles.entryPoints}>
                  {entry.accumulatedPoints} pts
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Action to Rewards Catalog */}
      <View style={styles.rewardsActionWrapper}>
        <Button
          label="Ver Catálogo de Canjes Escolares"
          icon={<Gift size={18} color="#FFFFFF" />}
          onPress={() => router.push('/(student)/community/rewards')}
          variant="mint"
          testID="btn-go-to-rewards"
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
    marginBottom: 20,
  },
  pointsSurface: {
    backgroundColor: colors.economy.pointsYellowSoft,
    borderWidth: 1.5,
    borderColor: colors.economy.pointsYellow,
    padding: 22,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  pointsLabel: {
    fontSize: 12,
    color: colors.economy.pointsYellowDark,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  pointsValue: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.economy.pointsYellowDark,
  },
  nonMonetaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  nonMonetaryText: {
    fontSize: 11,
    color: '#854D0E',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 15,
    flexShrink: 1,
  },
  badgesSection: {
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
  badgesGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  badgeCard: {
    flex: 1,
    backgroundColor: colors.background.surface,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 6,
  },
  badgeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 10,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  leaderboardSection: {
    marginBottom: 24,
  },
  leaderboardList: {
    backgroundColor: colors.background.surface,
    borderRadius: 20,
    padding: 12,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.divider,
    gap: 12,
  },
  leaderboardRowActive: {
    backgroundColor: colors.brand.primarySoft,
    borderRadius: 12,
  },
  rankCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankCircleActive: {
    backgroundColor: colors.brand.primary,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text.primary,
  },
  rankTextActive: {
    color: colors.text.inverse,
  },
  entryInfo: {
    flex: 1,
  },
  entryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryAlias: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  entryBadges: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  entryPoints: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.economy.pointsYellowDark,
  },
  rewardsActionWrapper: {
    marginTop: 8,
  },
});
