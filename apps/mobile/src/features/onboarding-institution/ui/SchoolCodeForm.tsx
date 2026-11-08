import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../shared/theme/colors.js';
import { Button } from '../../../shared/ui/Button.js';
import { Input } from '../../../shared/ui/Input.js';
import { InstitutionBanner } from '../../../entities/institution/ui/InstitutionBanner.js';
import { useSchoolCode } from '../hooks/useSchoolCode.js';

export interface SchoolCodeFormProps {
  onSuccess: (code: string, institutionName: string) => void;
  testID?: string;
}

export const SchoolCodeForm: React.FC<SchoolCodeFormProps> = ({
  onSuccess,
  testID = 'school-code-form',
}) => {
  const {
    code,
    isLoading,
    error,
    institution,
    isValid,
    handleCodeChange,
    validateCode,
  } = useSchoolCode();

  const handlePressVerify = async () => {
    const ok = await validateCode();
    if (ok && institution) {
      // Validated
    }
  };

  const handleContinue = () => {
    if (institution) {
      onSuccess(institution.code, institution.name);
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>Sumate a tu Escuela</Text>
      <Text style={styles.subtitle}>
        Ingresá el código de invitación que te compartió tu colegio para habilitar Cambiazo.
      </Text>

      <View style={styles.inputWrapper}>
        <Input
          label="Código Escolar"
          placeholder="Ej: BELGRANO2026"
          value={code}
          onChangeText={handleCodeChange}
          autoCapitalize="characters"
          error={error || undefined}
          helperText="Código alfanumérico entregado por la secretaría escolar"
          testID="school-code-input"
        />

        {!isValid && (
          <Button
            label={isLoading ? 'Verificando...' : 'Verificar Escuela'}
            onPress={handlePressVerify}
            variant="primary"
            disabled={code.length < 4 || isLoading}
            testID="btn-verify-school-code"
          />
        )}
      </View>

      {institution && (
        <View style={styles.verifiedSection} testID="verified-school-section">
          <InstitutionBanner
            name={institution.name}
            code={institution.code}
            subtitle="¡Colegio encontrado con éxito!"
          />

          <View style={styles.actionWrapper}>
            <Button
              label="Continuar con Registro Familiar"
              onPress={handleContinue}
              variant="mint"
              testID="btn-continue-registration"
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  inputWrapper: {
    gap: 12,
  },
  verifiedSection: {
    marginTop: 24,
    gap: 16,
  },
  actionWrapper: {
    marginTop: 8,
  },
});
