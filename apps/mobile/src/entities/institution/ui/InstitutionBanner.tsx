import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { School } from 'lucide-react-native';
import { colors } from '../../../shared/theme/colors';
import { Pill } from '../../../shared/ui/Pill';

export interface InstitutionBannerProps {
  name: string;
  code?: string;
  subtitle?: string;
  testID?: string;
}

export const InstitutionBanner: React.FC<InstitutionBannerProps> = ({
  name,
  code,
  subtitle = 'Comunidad Escolar Habilitada',
  testID = 'institution-banner',
}) => {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.iconCircle}>
        <School size={22} color={colors.brand.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.schoolName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {code ? (
        <Pill label={code} variant="primary" testID={`${testID}-code-pill`} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    padding: 16,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.brand.primarySoft,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolIcon: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.brand.primaryDark,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
