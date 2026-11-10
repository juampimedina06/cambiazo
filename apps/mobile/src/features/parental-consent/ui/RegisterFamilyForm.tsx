import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RegisterParentAndStudentSchema } from '@cambiazo/shared';
import { colors } from '../../../shared/theme/colors';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import {
  mockApiClient,
  type MockParentUser,
  type MockStudentUser,
} from '../../../shared/api/mock-client';
import { authStore } from '../../../shared/store/auth-store';

export interface RegisterFamilyFormProps {
  inviteCode: string;
  institutionName?: string;
  onSuccess: (parent: MockParentUser, student: MockStudentUser) => void;
  testID?: string;
}

export const RegisterFamilyForm: React.FC<RegisterFamilyFormProps> = ({
  inviteCode,
  institutionName,
  onSuccess,
  testID = 'register-family-form',
}) => {
  // Parent state
  const [parentFullName, setParentFullName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentDni, setParentDni] = useState('');

  // Student state
  const [studentFullName, setStudentFullName] = useState('');
  const [studentDni, setStudentDni] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [studentDob, setStudentDob] = useState('');

  // Error and loading state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setErrors({});
    setGeneralError(null);

    const payload = {
      inviteCode,
      parent: {
        fullName: parentFullName.trim(),
        email: parentEmail.trim().toLowerCase(),
        password: parentPassword,
        phone: parentPhone.trim() || undefined,
        dni: parentDni.trim(),
      },
      student: {
        fullName: studentFullName.trim(),
        dni: studentDni.trim(),
        grade: studentGrade.trim(),
        dateOfBirth: studentDob.trim(), // YYYY-MM-DD
      },
    };

    const validation = RegisterParentAndStudentSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const err of validation.error.errors) {
        const path = err.path.join('.');
        fieldErrors[path] = err.message;
      }
      setErrors(fieldErrors);
      setGeneralError('Por favor corregí los campos indicados antes de continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await mockApiClient.registerFamily(validation.data);
      if (!result.success || !result.parent || !result.student) {
        setGeneralError(result.error || 'Error al registrar la familia');
        return;
      }

      authStore.setParentSession(result.parent, result.student);
      onSuccess(result.parent, result.student);
    } catch {
      setGeneralError('Error de conexión al registrar. Intentalo nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      testID={testID}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Alta de Familia</Text>
        <Text style={styles.subtitle}>
          Registrá tu cuenta de tutor y vinculá a tu hijo/a en {institutionName || 'la institución'}.
        </Text>
      </View>

      {generalError && (
        <View style={styles.errorBox} testID="register-general-error">
          <Text style={styles.errorBoxText}>{generalError}</Text>
        </View>
      )}

      {/* SECTION 1: PARENT */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Datos del Padre, Madre o Tutor</Text>

        <Input
          label="Nombre y Apellido Completo"
          placeholder="Ej: Carolina Gómez"
          value={parentFullName}
          onChangeText={setParentFullName}
          error={errors['parent.fullName']}
          testID="input-parent-name"
        />

        <Input
          label="Correo Electrónico"
          placeholder="ejemplo@correo.com"
          value={parentEmail}
          onChangeText={setParentEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors['parent.email']}
          testID="input-parent-email"
        />

        <Input
          label="Contraseña (mínimo 8 caracteres)"
          placeholder="••••••••"
          value={parentPassword}
          onChangeText={setParentPassword}
          secureTextEntry
          error={errors['parent.password']}
          testID="input-parent-password"
        />

        <Input
          label="DNI del Tutor"
          placeholder="Ej: 32109876"
          value={parentDni}
          onChangeText={setParentDni}
          keyboardType="numeric"
          error={errors['parent.dni']}
          testID="input-parent-dni"
        />

        <Input
          label="Teléfono Móvil (Opcional)"
          placeholder="Ej: +5491122334455"
          value={parentPhone}
          onChangeText={setParentPhone}
          keyboardType="phone-pad"
          error={errors['parent.phone']}
          testID="input-parent-phone"
        />
      </View>

      {/* SECTION 2: STUDENT */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎒 Datos del Alumno/a</Text>

        <Input
          label="Nombre y Apellido del Alumno"
          placeholder="Ej: Mateo Gómez"
          value={studentFullName}
          onChangeText={setStudentFullName}
          error={errors['student.fullName']}
          testID="input-student-name"
        />

        <Input
          label="DNI del Alumno"
          placeholder="Ej: 52345678"
          value={studentDni}
          onChangeText={setStudentDni}
          keyboardType="numeric"
          error={errors['student.dni']}
          testID="input-student-dni"
        />

        <Input
          label="Grado / División Escolar"
          placeholder="Ej: 6° Primaria A"
          value={studentGrade}
          onChangeText={setStudentGrade}
          error={errors['student.grade']}
          testID="input-student-grade"
        />

        <Input
          label="Fecha de Nacimiento (AAAA-MM-DD)"
          placeholder="2014-05-12"
          value={studentDob}
          onChangeText={setStudentDob}
          error={errors['student.dateOfBirth']}
          helperText="Formato requerido: Año-Mes-Día (ej. 2014-05-12)"
          testID="input-student-dob"
        />
      </View>

      <View style={styles.submitSection}>
        <Button
          label={isSubmitting ? 'Registrando...' : 'Registrar y Continuar al Consentimiento'}
          onPress={handleSubmit}
          variant="primary"
          disabled={isSubmitting}
          testID="btn-submit-family-registration"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: colors.status.danger,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBoxText: {
    color: colors.status.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.brand.primaryDark,
    marginBottom: 14,
  },
  submitSection: {
    marginTop: 8,
  },
});
