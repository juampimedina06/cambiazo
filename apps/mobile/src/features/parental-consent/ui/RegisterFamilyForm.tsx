import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { User, Users, GraduationCap, Pencil, BookOpen } from 'lucide-react-native';
import { RegisterParentAndStudentSchema } from '@cambiazo/shared';
import { colors } from '../../../shared/theme/colors';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { DatePickerField } from '../../../shared/ui/DatePickerField';
import { SelectPickerField, type SelectOption } from '../../../shared/ui/SelectPickerField';
import { NumericStepperField } from '../../../shared/ui/NumericStepperField';
import {
  mockApiClient,
  type MockParentUser,
  type MockStudentUser,
} from '../../../shared/api/mock-client';
import { authStore } from '../../../shared/store/auth-store';

export interface RegisterFamilyFormProps {
  inviteCode: string;
  institutionName?: string;
  onSuccess: (
    parent: MockParentUser,
    student: MockStudentUser,
    students?: MockStudentUser[]
  ) => void;
  testID?: string;
}

export interface StudentFormDraft {
  fullName: string;
  dni: string;
  grade: string;
  dateOfBirth: string;
}

export const SCHOOL_GRADE_OPTIONS: SelectOption[] = [
  { label: '1° Primaria A', value: '1° Primaria A', subtitle: 'Primer Ciclo · Turno Mañana', icon: <Pencil size={18} color={colors.brand.primary} /> },
  { label: '1° Primaria B', value: '1° Primaria B', subtitle: 'Primer Ciclo · Turno Tarde', icon: <Pencil size={18} color={colors.brand.primary} /> },
  { label: '2° Primaria A', value: '2° Primaria A', subtitle: 'Primer Ciclo · Primaria', icon: <Pencil size={18} color={colors.brand.primary} /> },
  { label: '3° Primaria A', value: '3° Primaria A', subtitle: 'Primer Ciclo · Primaria', icon: <Pencil size={18} color={colors.brand.primary} /> },
  { label: '4° Primaria A', value: '4° Primaria A', subtitle: 'Segundo Ciclo · Primaria', icon: <BookOpen size={18} color={colors.brand.primary} /> },
  { label: '5° Primaria A', value: '5° Primaria A', subtitle: 'Segundo Ciclo · Primaria', icon: <BookOpen size={18} color={colors.brand.primary} /> },
  { label: '6° Primaria A', value: '6° Primaria A', subtitle: 'Segundo Ciclo · Primaria', icon: <BookOpen size={18} color={colors.brand.primary} /> },
  { label: '7° Primaria A', value: '7° Primaria A', subtitle: 'Séptimo Grado · Primaria', icon: <BookOpen size={18} color={colors.brand.primary} /> },
  { label: '1° Secundaria A', value: '1° Secundaria A', subtitle: 'Ciclo Básico · Secundaria', icon: <GraduationCap size={18} color={colors.brand.primary} /> },
  { label: '2° Secundaria A', value: '2° Secundaria A', subtitle: 'Ciclo Básico · Secundaria', icon: <GraduationCap size={18} color={colors.brand.primary} /> },
  { label: '3° Secundaria A', value: '3° Secundaria A', subtitle: 'Ciclo Básico · Secundaria', icon: <GraduationCap size={18} color={colors.brand.primary} /> },
  { label: '4° Secundaria A', value: '4° Secundaria A', subtitle: 'Ciclo Orientado · Secundaria', icon: <GraduationCap size={18} color={colors.brand.primary} /> },
  { label: '5° Secundaria A', value: '5° Secundaria A', subtitle: 'Ciclo Orientado · Secundaria', icon: <GraduationCap size={18} color={colors.brand.primary} /> },
  { label: '6° Secundaria A', value: '6° Secundaria A', subtitle: 'Promo · Secundaria', icon: <GraduationCap size={18} color={colors.brand.primary} /> },
];

const createEmptyStudent = (): StudentFormDraft => ({
  fullName: '',
  dni: '',
  grade: '6° Primaria A',
  dateOfBirth: '2014-05-15',
});

export const RegisterFamilyForm: React.FC<RegisterFamilyFormProps> = ({
  inviteCode,
  institutionName,
  onSuccess,
  testID = 'register-family-form',
}) => {
  const pagerRef = useRef<any>(null);
  const defaultWidth = Math.max(300, Dimensions.get('window').width - 40);
  const [pageWidth, setPageWidth] = useState<number>(defaultWidth);
  const [activeStep, setActiveStep] = useState<number>(0); // 0 = Tutor, 1..N = Alumno 1..N

  // Parent state
  const [parentFullName, setParentFullName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentDni, setParentDni] = useState('');

  // Multi-student state
  const [students, setStudents] = useState<StudentFormDraft[]>([createEmptyStudent()]);

  // Error and loading state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const studentCount = students.length;
  const totalSteps = 1 + studentCount;

  const handleStudentCountChange = (nextCount: number) => {
    const clamped = Math.min(5, Math.max(1, nextCount));
    setStudents((prev) => {
      if (clamped === prev.length) return prev;
      if (clamped > prev.length) {
        const additions = Array.from({ length: clamped - prev.length }, () =>
          createEmptyStudent()
        );
        return [...prev, ...additions];
      }
      return prev.slice(0, clamped);
    });
    if (activeStep > clamped) {
      goToStep(clamped);
    }
  };

  const updateStudentField = (
    index: number,
    field: keyof StudentFormDraft,
    value: string
  ) => {
    setStudents((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const goToStep = (stepIndex: number) => {
    const target = Math.max(0, Math.min(totalSteps - 1, stepIndex));
    setActiveStep(target);
    if (pagerRef.current && typeof pagerRef.current.scrollTo === 'function') {
      pagerRef.current.scrollTo({ x: target * pageWidth, animated: true });
    }
  };

  const validateParentBeforeSlide = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (parentFullName.trim().length < 2) {
      nextErrors['parent.fullName'] = 'Ingresá tu nombre y apellido completo.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())) {
      nextErrors['parent.email'] = 'Ingresá un correo electrónico válido.';
    }
    if (parentPassword.length < 8) {
      nextErrors['parent.password'] = 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (!/^\d{7,9}$/.test(parentDni.trim())) {
      nextErrors['parent.dni'] = 'El DNI debe tener entre 7 y 9 números.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setGeneralError('Completá tus datos de tutor antes de deslizar al alta de alumno/a.');
      return false;
    }
    setGeneralError(null);
    return true;
  };

  const handleNextFromParent = () => {
    if (validateParentBeforeSlide()) {
      goToStep(1);
    }
  };

  const handleMomentumScrollEnd = (event: any) => {
    const offsetX = event?.nativeEvent?.contentOffset?.x ?? 0;
    if (pageWidth > 0) {
      const nextStep = Math.round(offsetX / pageWidth);
      if (nextStep !== activeStep && nextStep >= 0 && nextStep < totalSteps) {
        setActiveStep(nextStep);
      }
    }
  };

  const handleSubmit = async () => {
    setErrors({});
    setGeneralError(null);

    const parentPayload = {
      fullName: parentFullName.trim(),
      email: parentEmail.trim().toLowerCase(),
      password: parentPassword,
      phone: parentPhone.trim() || undefined,
      dni: parentDni.trim(),
    };

    const fieldErrors: Record<string, string> = {};
    let firstErrorStep: number | null = null;

    students.forEach((st, idx) => {
      const singlePayload = {
        inviteCode,
        parent: parentPayload,
        student: {
          fullName: st.fullName.trim(),
          dni: st.dni.trim(),
          grade: st.grade.trim(),
          dateOfBirth: st.dateOfBirth.trim(),
        },
      };

      const validation = RegisterParentAndStudentSchema.safeParse(singlePayload);
      if (!validation.success) {
        for (const err of validation.error.errors) {
          const path = err.path.join('.');
          if (path.startsWith('parent.')) {
            fieldErrors[path] = err.message;
            if (firstErrorStep === null) firstErrorStep = 0;
          } else if (path.startsWith('student.')) {
            const subField = path.replace('student.', '');
            fieldErrors[`students.${idx}.${subField}`] = err.message;
            if (idx === 0) {
              fieldErrors[path] = err.message;
            }
            if (firstErrorStep === null) firstErrorStep = idx + 1;
          }
        }
      }
    });

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setGeneralError('Por favor revisá los campos marcados antes de continuar.');
      if (firstErrorStep !== null) {
        goToStep(firstErrorStep);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await mockApiClient.registerFamilyWithMultipleStudents({
        inviteCode,
        parent: parentPayload,
        students: students.map((st) => ({
          fullName: st.fullName.trim(),
          dni: st.dni.trim(),
          grade: st.grade.trim(),
          dateOfBirth: st.dateOfBirth.trim(),
        })),
      });

      if (!result.success || !result.parent || !result.student) {
        setGeneralError(result.error || 'Error al registrar la familia');
        return;
      }

      const allRegisteredStudents = result.students || [result.student];
      authStore.setParentSession(result.parent, result.student, allRegisteredStudents);
      onSuccess(result.parent, result.student, allRegisteredStudents);
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
      <View
        style={styles.header}
        onLayout={(e) => {
          const measured = e?.nativeEvent?.layout?.width;
          if (measured && measured > 200) {
            setPageWidth(measured);
          }
        }}
      >
        <Text style={styles.title}>Alta de Familia</Text>
        <Text style={styles.subtitle}>
          Completá tus datos de tutor y deslizá para vincular a {studentCount === 1 ? 'tu hijo/a' : `tus ${studentCount} hijos/as`} en{' '}
          {institutionName || 'la institución'}.
        </Text>
      </View>

      {/* STEP PILLS / SWIPE NAVIGATION BAR */}
      <View style={styles.stepperHeader}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepPillsRow}
        >
          <TouchableOpacity
            style={[styles.stepPill, activeStep === 0 && styles.stepPillActive]}
            onPress={() => goToStep(0)}
            testID="step-pill-parent"
          >
            <View style={styles.stepPillContent}>
              <User size={13} color={activeStep === 0 ? colors.text.inverse : colors.text.secondary} />
              <Text style={[styles.stepPillText, activeStep === 0 && styles.stepPillTextActive]}>
                1. Tutor
              </Text>
            </View>
          </TouchableOpacity>

          {students.map((st, idx) => {
            const stepNum = idx + 1;
            const isActive = activeStep === stepNum;
            const shortName = st.fullName.trim().split(' ')[0];
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.stepPill, isActive && styles.stepPillActive]}
                onPress={() => goToStep(stepNum)}
                testID={`step-pill-student-${idx}`}
              >
                <View style={styles.stepPillContent}>
                  <GraduationCap
                    size={13}
                    color={isActive ? colors.text.inverse : colors.text.secondary}
                  />
                  <Text style={[styles.stepPillText, isActive && styles.stepPillTextActive]}>
                    {stepNum + 1}. {shortName ? shortName : `Hijo/a ${idx + 1}`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={styles.swipeHint}>↔ Deslizá hacia los lados o tocá cada paso</Text>
      </View>

      {generalError && (
        <View style={styles.errorBox} testID="register-general-error">
          <Text style={styles.errorBoxText}>{generalError}</Text>
        </View>
      )}

      {/* HORIZONTAL SWIPEABLE PAGES */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        testID="register-family-swiper"
      >
        {/* SLIDE 0: TUTOR + CANTIDAD DE HIJOS */}
        <View style={[styles.slidePage, { width: pageWidth }]} testID="slide-parent">
          <View style={styles.sectionCard}>
            <View style={styles.slideBadgeRow}>
              <View style={styles.sectionTitleRow}>
                <User size={18} color={colors.brand.primary} />
                <Text style={styles.sectionTitle}>Paso 1: Datos del Tutor</Text>
              </View>
              <View style={styles.stepCounterBadge}>
                <Text style={styles.stepCounterText}>1 / {totalSteps}</Text>
              </View>
            </View>

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
              label="DNI del Tutor (solo números)"
              placeholder="Ej: 32109876"
              value={parentDni}
              onChangeText={setParentDni}
              numericOnly
              maxLength={9}
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

            <View style={styles.divider} />

            <NumericStepperField
              label="¿Cuántos hijos/as vas a vincular?"
              value={studentCount}
              onChange={handleStudentCountChange}
              min={1}
              max={5}
              step={1}
              suffix={studentCount === 1 ? 'hijo/a' : 'hijos/as'}
              presets={[1, 2, 3, 4]}
              helperText="Se creará una tarjeta deslizable por cada hijo/a."
              testID="stepper-student-count"
            />

            <View style={styles.slideFooter}>
              <Button
                label="Deslizar a Datos del Alumno 1 →"
                onPress={handleNextFromParent}
                variant="primary"
                testID="btn-next-to-student-0"
              />
            </View>
          </View>
        </View>

        {/* SLIDES 1..N: CADA HIJO/A */}
        {students.map((studentItem, idx) => {
          const isLastStudent = idx === studentCount - 1;
          const stepNumber = idx + 2;

          return (
            <View
              key={idx}
              style={[styles.slidePage, { width: pageWidth }]}
              testID={`slide-student-${idx}`}
            >
              <View style={styles.sectionCard}>
                <View style={styles.slideBadgeRow}>
                  <View style={styles.sectionTitleRow}>
                    <GraduationCap size={18} color={colors.brand.primary} />
                    <Text style={styles.sectionTitle}>
                      Alumno/a {idx + 1} de {studentCount}
                    </Text>
                  </View>
                  <View style={styles.stepCounterBadge}>
                    <Text style={styles.stepCounterText}>
                      {stepNumber} / {totalSteps}
                    </Text>
                  </View>
                </View>

                <Input
                  label="Nombre y Apellido del Alumno/a"
                  placeholder={idx === 0 ? 'Ej: Mateo Gómez' : 'Ej: Sofía Gómez'}
                  value={studentItem.fullName}
                  onChangeText={(val) => updateStudentField(idx, 'fullName', val)}
                  error={errors[`students.${idx}.fullName`] || (idx === 0 ? errors['student.fullName'] : undefined)}
                  testID={idx === 0 ? 'input-student-name' : `input-student-name-${idx}`}
                />

                <Input
                  label="DNI del Alumno/a (solo números)"
                  placeholder="Ej: 52345678"
                  value={studentItem.dni}
                  onChangeText={(val) => updateStudentField(idx, 'dni', val)}
                  numericOnly
                  maxLength={9}
                  error={errors[`students.${idx}.dni`] || (idx === 0 ? errors['student.dni'] : undefined)}
                  testID={idx === 0 ? 'input-student-dni' : `input-student-dni-${idx}`}
                />

                <SelectPickerField
                  label="Grado / División Escolar"
                  value={studentItem.grade}
                  options={SCHOOL_GRADE_OPTIONS}
                  onChange={(val) => updateStudentField(idx, 'grade', val)}
                  placeholder="Seleccionar grado o año"
                  error={errors[`students.${idx}.grade`] || (idx === 0 ? errors['student.grade'] : undefined)}
                  testID={idx === 0 ? 'input-student-grade' : `input-student-grade-${idx}`}
                />

                <DatePickerField
                  label="Fecha de Nacimiento"
                  value={studentItem.dateOfBirth}
                  onChange={(val) => updateStudentField(idx, 'dateOfBirth', val)}
                  minYear={2007}
                  maxYear={2021}
                  error={
                    errors[`students.${idx}.dateOfBirth`] ||
                    (idx === 0 ? errors['student.dateOfBirth'] : undefined)
                  }
                  helperText="Tocá para elegir Día, Mes y Año con el selector nativo"
                  testID={idx === 0 ? 'input-student-dob' : `input-student-dob-${idx}`}
                />

                {/* QUICK SIBLING ADD/REMOVE BAR */}
                <View style={styles.siblingActionRow}>
                  {studentCount < 5 && (
                    <TouchableOpacity
                      style={styles.addSiblingBtn}
                      onPress={() => {
                        const newIndex = studentCount;
                        handleStudentCountChange(studentCount + 1);
                        setTimeout(() => goToStep(newIndex + 1), 80);
                      }}
                      testID={`btn-add-sibling-${idx}`}
                    >
                      <Text style={styles.addSiblingText}>+ Agregar otro hermano/a</Text>
                    </TouchableOpacity>
                  )}

                  {studentCount > 1 && (
                    <TouchableOpacity
                      style={styles.removeSiblingBtn}
                      onPress={() => handleStudentCountChange(studentCount - 1)}
                      testID={`btn-remove-sibling-${idx}`}
                    >
                      <Text style={styles.removeSiblingText}>Quitar último ({studentCount})</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.slideNavRow}>
                  <Button
                    label={idx === 0 ? '← Tutor' : `← Hijo/a ${idx}`}
                    onPress={() => goToStep(idx)}
                    variant="secondary"
                    style={styles.backBtn}
                    testID={`btn-prev-step-${idx}`}
                  />

                  {!isLastStudent ? (
                    <Button
                      label={`Siguiente: Hijo/a ${idx + 2} →`}
                      onPress={() => goToStep(idx + 2)}
                      variant="primary"
                      style={styles.nextBtn}
                      testID={`btn-next-student-${idx}`}
                    />
                  ) : (
                    <Button
                      label={
                        isSubmitting
                          ? 'Registrando...'
                          : studentCount > 1
                          ? `Registrar Familia (${studentCount} hijos)`
                          : 'Registrar y Continuar'
                      }
                      onPress={handleSubmit}
                      variant="primary"
                      disabled={isSubmitting}
                      style={styles.nextBtn}
                      testID="btn-submit-family-registration"
                    />
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
    marginBottom: 14,
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
  stepperHeader: {
    marginBottom: 16,
  },
  stepPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  stepPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: colors.background.surface,
    borderWidth: 1.5,
    borderColor: colors.brand.primarySoft,
  },
  stepPillActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  stepPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stepPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  stepPillTextActive: {
    color: colors.text.inverse,
    fontWeight: '800',
  },
  swipeHint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 6,
    fontWeight: '500',
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
  slidePage: {
    paddingRight: 4,
  },
  sectionCard: {
    backgroundColor: colors.background.surface,
    borderRadius: 22,
    padding: 18,
  },
  slideBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.brand.primaryDark,
  },
  stepCounterBadge: {
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  stepCounterText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brand.primaryDark,
  },
  divider: {
    height: 1,
    backgroundColor: colors.background.divider,
    marginVertical: 14,
  },
  slideFooter: {
    marginTop: 10,
  },
  siblingActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
    marginBottom: 14,
  },
  addSiblingBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.brand.primarySoft,
  },
  addSiblingText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand.primaryDark,
  },
  removeSiblingBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  removeSiblingText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.status.danger,
  },
  slideNavRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  backBtn: {
    flex: 0.9,
  },
  nextBtn: {
    flex: 1.5,
  },
});
