import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/shared/theme/colors.js';
import { LogoPencilC } from '../../src/shared/ui/LogoPencilC.js';
import { SchoolCodeForm } from '../../src/features/onboarding-institution/ui/SchoolCodeForm.js';

export default function SchoolCodeScreen() {
  const router = useRouter();

  const handleSuccess = (code: string, institutionName: string) => {
    router.push(`/(auth)/register-family?code=${encodeURIComponent(code)}&institution=${encodeURIComponent(institutionName)}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      testID="screen-school-code"
    >
      <View style={styles.header}>
        <LogoPencilC size="lg" showLabel={true} />
      </View>

      <SchoolCodeForm onSuccess={handleSuccess} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  content: {
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 12,
  },
});
