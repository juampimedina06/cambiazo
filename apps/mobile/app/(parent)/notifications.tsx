import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/shared/theme/colors';
import { Pill } from '../../src/shared/ui/Pill';
import { FlatListItem } from '../../src/shared/ui/FlatListItem';
import { authStore, type AuthState } from '../../src/shared/store/auth-store';
import { mockApiClient, type MockPurchase } from '../../src/shared/api/mock-client';

export default function ParentNotificationsScreen() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());
  const [purchases, setPurchases] = useState<MockPurchase[]>([]);

  useEffect(() => {
    return authStore.subscribe((state) => {
      setAuthState(state);
    });
  }, []);

  const student = authState.student || mockApiClient.getStudent('22222222-2222-4222-8222-222222222222');
  const studentId = student?.id || '22222222-2222-4222-8222-222222222222';

  useEffect(() => {
    if (studentId) {
      const list = mockApiClient.getPurchases(studentId);
      setPurchases(list);
    }
  }, [studentId]);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      testID="screen-parent-notifications"
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.replace('/(parent)')}
          style={styles.backButton}
          testID="btn-notifications-back"
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Pill label="Notificaciones" variant="primary" icon="🔔" />
      </View>

      <Text style={styles.title}>Alertas de Compra</Text>
      <Text style={styles.subtitle}>
        Consumos en tiempo real en el kiosco escolar de {student?.fullName || 'Mateo Gómez'}
      </Text>

      {/* Flat List of Purchases — NO CARD-IN-CARD, MAX 3 DATA POINTS */}
      <View style={styles.purchasesContainer} testID="notifications-flat-list">
        {purchases.length === 0 ? (
          <View style={styles.emptyContainer} testID="empty-notifications">
            <Text style={styles.emptyIcon}>🛍️</Text>
            <Text style={styles.emptyTitle}>Sin consumos registrados</Text>
            <Text style={styles.emptySubtitle}>
              Las compras que realice tu hijo/a en el recreo se mostrarán aquí de forma inmediata.
            </Text>
          </View>
        ) : (
          purchases.map((purchase, index) => {
            const amountFormatted = ((purchase.amountCents) / 100).toLocaleString('es-AR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            });
            return (
              <FlatListItem
                key={purchase.id || `purchase-${index}`}
                icon={purchase.icon || '🛍️'}
                title={`${purchase.itemsSummary} • ${purchase.timestamp}`}
                highlightValue={`-$${amountFormatted}`}
                valueType="neutral"
                testID={`notification-item-${index}`}
              />
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
    marginBottom: 20,
  },
  purchasesContainer: {
    // Flat on canvas, no card nesting
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
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
});
