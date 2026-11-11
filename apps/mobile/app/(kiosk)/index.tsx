import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Zap, QrCode } from 'lucide-react-native';
import { colors } from '../../src/shared/theme/colors';
import { Button } from '../../src/shared/ui/Button';
import { Pill } from '../../src/shared/ui/Pill';
import { LogoPencilC } from '../../src/shared/ui/LogoPencilC';

export default function KioskHomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container} testID="screen-kiosk-home">
      <View style={styles.header}>
        <LogoPencilC size="md" showLabel={true} />
        <Pill
          label="Modo Kiosco POS"
          variant="points"
          icon={<Zap size={13} color={colors.economy.pointsYellowDark} fill={colors.economy.pointsYellowDark} />}
        />
      </View>

      <View style={styles.scannerCard}>
        <View style={styles.scannerIconWrapper}>
          <QrCode size={56} color={colors.brand.primary} />
        </View>
        <Text style={styles.scannerTitle}>Lector de Código QR</Text>
        <Text style={styles.scannerSubtitle}>
          Cobrá en menos de 3 toques y menos de 5 segundos durante el recreo.
        </Text>

        <Button
          label="Escanear QR del Alumno"
          onPress={() => router.push('/(kiosk)/pos')}
          variant="primary"
          testID="btn-kiosk-scan"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.canvas,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  scannerCard: {
    backgroundColor: colors.background.surface,
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  scannerIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  scannerSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
});
