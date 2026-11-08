import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../src/shared/theme/colors.js';
import { Button } from '../../src/shared/ui/Button.js';
import { Pill } from '../../src/shared/ui/Pill.js';
import { LogoPencilC } from '../../src/shared/ui/LogoPencilC.js';

export default function KioskHomeScreen() {
  return (
    <View style={styles.container} testID="screen-kiosk-home">
      <View style={styles.header}>
        <LogoPencilC size="md" showLabel={true} />
        <Pill label="Modo Kiosco POS" variant="points" icon="⚡" />
      </View>

      <View style={styles.scannerCard}>
        <Text style={styles.scannerIcon}>📷</Text>
        <Text style={styles.scannerTitle}>Lector de Código QR</Text>
        <Text style={styles.scannerSubtitle}>
          Cobrá en menos de 3 toques y menos de 5 segundos durante el recreo.
        </Text>

        <Button
          label="Escanear QR del Alumno"
          onPress={() => {}}
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
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    gap: 16,
  },
  scannerIcon: {
    fontSize: 48,
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
