import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../shared/theme/colors.js';
import { Pill } from '../../../shared/ui/Pill.js';

export interface StudentHeaderProps {
  fullName: string;
  institutionName: string;
  communityPoints: number;
  testID?: string;
}

/**
 * Header Alumno:
 * Saludo ("Hola, Mateo") + Badge Escuela + Píldora amarilla con Puntos Comunitarios.
 */
export const StudentHeader: React.FC<StudentHeaderProps> = ({
  fullName,
  institutionName,
  communityPoints,
  testID = 'student-header',
}) => {
  const firstName = fullName.split(' ')[0] || fullName;

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.left}>
        <Text style={styles.greeting}>¡Hola, {firstName}! 👋</Text>
        <Text style={styles.schoolBadge} numberOfLines={1}>
          🏫 {institutionName}
        </Text>
      </View>
      <Pill
        label={`${communityPoints} Pts`}
        icon="⭐"
        variant="points"
        testID={`${testID}-points-pill`}
      />
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
  left: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
  },
  schoolBadge: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
    fontWeight: '500',
  },
});
