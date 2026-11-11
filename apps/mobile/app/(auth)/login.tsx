import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, LogIn, UserPlus, AlertCircle } from 'lucide-react-native';
import { colors } from '../../src/shared/theme/colors';
import { LogoPencilC } from '../../src/shared/ui/LogoPencilC';
import { InstitutionBanner } from '../../src/entities/institution/ui/InstitutionBanner';
import { Input } from '../../src/shared/ui/Input';
import { Button } from '../../src/shared/ui/Button';
import { loginWithSchoolCodeAction } from '../../src/core';
import { authStore } from '../../src/shared/store/auth-store';

export default function SchoolLoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; institution?: string }>();
  const storedInstitution = authStore.getState().institution;
  const inviteCode = (params.code || storedInstitution?.code || '').toUpperCase();
  const institutionName = params.institution || storedInstitution?.name || 'Institución Escolar';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!identifier.trim() || !password) {
      setError('Completá tu email o DNI y contraseña.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await loginWithSchoolCodeAction({
        inviteCode,
        identifier: identifier.trim(),
        password,
      });

      if (!result.success) {
        setError(result.error || 'No pudimos iniciar sesión. Revisá tus datos.');
        return;
      }

      if (result.role === 'PARENT' && result.parent) {
        authStore.setParentSession(
          result.parent,
          result.student,
          result.students,
          result.institution
        );
        router.replace('/(parent)');
        return;
      }

      if (result.role === 'STUDENT' && result.student) {
        authStore.setStudentSession(result.student, result.institution);
        router.replace('/(student)');
        return;
      }

      setError('No pudimos determinar el perfil de tu cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToRegister = () => {
    router.replace(
      `/(auth)/register-family?code=${encodeURIComponent(inviteCode)}&institution=${encodeURIComponent(institutionName)}`
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      testID="screen-login"
    >
        <View style={styles.topNav}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            testID="btn-login-back"
          >
            <ArrowLeft size={18} color={colors.text.secondary} />
            <Text style={styles.backText}>Cambiar colegio</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.brandHeader}>
          <LogoPencilC size="md" showLabel={true} />
          <Text style={styles.title}>Iniciar Sesión</Text>
          <Text style={styles.subtitle}>
            Ingresá como Padre/Tutor o Alumno en tu colegio
          </Text>
        </View>

        <View style={styles.bannerWrap}>
          <InstitutionBanner
            name={institutionName}
            code={inviteCode}
            subtitle="Colegio seleccionado"
          />
        </View>

        <View style={styles.formSurface}>
          <Input
            label="Email (Padre/Tutor) o DNI"
            placeholder="Ej: nombre@email.com o 48123456"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
            testID="input-login-identifier"
          />

          <Input
            label="Contraseña"
            placeholder="Ingresá tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            autoCapitalize="none"
            testID="input-login-password"
          />

          {error ? (
            <View style={styles.errorBox} testID="login-error-banner">
              <AlertCircle size={16} color={colors.status.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.submitWrap}>
            <Button
              label={loading ? 'Ingresando...' : 'Iniciar Sesión'}
              onPress={handleSubmit}
              disabled={loading}
              variant="primary"
              icon={<LogIn size={20} color="#FFFFFF" />}
              testID="btn-login-submit"
            />
          </View>
        </View>

        <View style={styles.registerPrompt}>
          <Text style={styles.registerPromptText}>¿Todavía no registraste tu familia?</Text>
          <Button
            label="Registrarme (Nueva Familia)"
            onPress={handleGoToRegister}
            variant="outline"
            icon={<UserPlus size={18} color={colors.brand.primary} />}
            testID="btn-login-go-register"
          />
        </View>

        <View style={styles.demoHint}>
          <Text style={styles.demoTitle}>¿Cómo ingreso?</Text>
          <Text style={styles.demoBody}>
            Padres/Tutores ingresan con su email y contraseña. Alumnos ingresan con su DNI y la contraseña familiar (o su clave personalizada si la cambiaron).
          </Text>
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  content: {
    paddingBottom: 32,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  bannerWrap: {
    marginBottom: 16,
  },
  formSurface: {
    backgroundColor: colors.background.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.status.danger,
  },
  submitWrap: {
    marginTop: 4,
  },
  registerPrompt: {
    backgroundColor: colors.background.surface,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    marginBottom: 16,
  },
  registerPromptText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  demoHint: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brand.primaryDark,
  },
  demoBody: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
