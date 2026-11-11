import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star, School } from 'lucide-react-native';
import { colors } from '../../../shared/theme/colors';
import { Pill } from '../../../shared/ui/Pill';
import { LogoPencilC } from '../../../shared/ui/LogoPencilC';

export interface StudentHeaderProps {
  fullName: string;
  institutionName: string;
  communityPoints: number;
  onLogout?: () => void;
  testID?: string;
}

/**
 * Header Alumno:
 * Isologo oficial + Saludo ("Hola, Mateo") + Badge Escuela + Píldora amarilla con Puntos Comunitarios.
 */
export const StudentHeader: React.FC<StudentHeaderProps> = ({
  fullName,
  institutionName,
  communityPoints,
  onLogout,
  testID = 'student-header',
}) => {
  const firstName = fullName.split(' ')[0] || fullName;

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.brandAndGreeting}>
        <LogoPencilC size="sm" showLabel={false} testID={`${testID}-logo`} />
        <View style={styles.left}>
          <Text style={styles.greeting}>¡Hola, {firstName}!</Text>
          <View style={styles.schoolRow}>
            <School size={12} color={colors.text.secondary} />
            <Text style={styles.schoolBadge} numberOfLines={1}>
              {institutionName}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.rightActions}>
        <Pill
          label={`${communityPoints} Pts`}
          icon={<Star size={13} color={colors.economy.pointsYellowDark} fill={colors.economy.pointsYellow} />}
          variant="points"
          testID={`${testID}-points-pill`}
        />
        {onLogout && (
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn} testID={`${testID}-logout-btn`}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  brandAndGreeting: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 8,
  },
  left: {
    flex: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
  },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  schoolBadge: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
});
