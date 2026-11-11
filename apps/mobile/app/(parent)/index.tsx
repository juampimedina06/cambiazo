import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  School,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  CreditCard,
  Sliders,
  Bell,
  BarChart3,
  LogOut,
  UserCheck,
} from 'lucide-react-native';
import { colors } from '../../src/shared/theme/colors';
import { Button } from '../../src/shared/ui/Button';
import { Pill } from '../../src/shared/ui/Pill';
import { LogoPencilC } from '../../src/shared/ui/LogoPencilC';
import { ConsentStatusBadge } from '../../src/entities/student-profile/ui/ConsentStatusBadge';
import { ConsentRevocationModal } from '../../src/features/parental-consent/ui/ConsentRevocationModal';
import { DigitalConsentModal } from '../../src/features/parental-consent/ui/DigitalConsentModal';
import { authStore, type AuthState } from '../../src/shared/store/auth-store';
import { mockApiClient } from '../../src/shared/api/mock-client';

export default function ParentHomeScreen() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());
  const [showRevocationModal, setShowRevocationModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  useEffect(() => {
    return authStore.subscribe((state) => {
      setAuthState(state);
    });
  }, []);

  const student = authState.student || mockApiClient.getStudent('22222222-2222-4222-8222-222222222222');
  const linkedStudents =
    authState.students && authState.students.length > 0
      ? authState.students
      : student
      ? [student]
      : [];
  const parentName = authState.parent?.fullName || 'Carolina Gómez';
  const institutionName = authState.institution?.name || 'Colegio Manuel Belgrano';

  const consentStatus = student?.consentStatus || 'PENDING';

  const handleRevocationSuccess = () => {
    if (student) {
      authStore.updateStudentConsent('REVOKED', student.id);
    }
  };

  const handleConsentGranted = () => {
    setShowConsentModal(false);
    if (student) {
      authStore.updateStudentConsent('GRANTED', student.id);
    }
  };

  const handleNavigateToStudent = () => {
    if (student) {
      authStore.setStudentSession(student);
      router.push('/(student)');
    }
  };

  const handleLogout = () => {
    authStore.logout();
    router.replace('/(auth)/school-code');
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      testID="screen-parent-home"
    >
      <View style={styles.topHeader}>
        <LogoPencilC size="sm" showLabel={true} />
        <View style={styles.headerRight}>
          <Pill
            label="Panel Tutor"
            variant="primary"
            icon={<UserCheck size={13} color={colors.brand.primary} />}
          />
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} testID="btn-logout-parent">
            <LogOut size={13} color="#DC2626" />
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.greeting}>Hola, {parentName.split(' ')[0]}</Text>
      <View style={styles.institutionRow}>
        <School size={15} color={colors.text.secondary} />
        <Text style={styles.institutionSubtitle}>{institutionName}</Text>
      </View>

      {/* MULTI-STUDENT SELECTOR (shown when parent has multiple children) */}
      {linkedStudents.length > 1 && (
        <View style={styles.siblingSelectorBar} testID="parent-sibling-selector">
          <View style={styles.siblingTitleRow}>
            <Users size={14} color={colors.text.secondary} />
            <Text style={styles.siblingSelectorTitle}>
              Hijos/as vinculados ({linkedStudents.length})
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.siblingChipsRow}
          >
            {linkedStudents.map((child) => {
              const isSelected = child.id === student?.id;
              return (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.siblingChip, isSelected && styles.siblingChipActive]}
                  onPress={() => authStore.selectStudent(child.id)}
                  testID={`btn-select-sibling-${child.id}`}
                >
                  <View style={styles.siblingChipHeader}>
                    <GraduationCap
                      size={14}
                      color={isSelected ? colors.text.inverse : colors.text.secondary}
                    />
                    <Text
                      style={[
                        styles.siblingChipName,
                        isSelected && styles.siblingChipNameActive,
                      ]}
                    >
                      {child.fullName.split(' ')[0]}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.siblingChipGrade,
                      isSelected && styles.siblingChipGradeActive,
                    ]}
                  >
                    {child.grade}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* STUDENT OVERVIEW (Flat surface on canvas) */}
      <View style={styles.studentCard} testID="parent-student-card">
        <View style={styles.studentHeaderRow}>
          <View>
            <Text style={styles.studentLabel}>Hijo/a Vinculado/a</Text>
            <Text style={styles.studentName}>{student?.fullName || 'Mateo Gómez'}</Text>
            <Text style={styles.studentGrade}>{student?.grade || '6° Primaria'}</Text>
          </View>
          <ConsentStatusBadge status={consentStatus} testID="parent-consent-status-badge" />
        </View>

        {consentStatus === 'PENDING' && (
          <View style={styles.alertPendingBox} testID="banner-consent-pending">
            <View style={styles.alertTitleRow}>
              <AlertTriangle size={16} color="#92400E" />
              <Text style={styles.alertPendingTitle}>Firma Digital Requerida (Ley 25.326)</Text>
            </View>
            <Text style={styles.alertPendingText}>
              Para que el alumno pueda utilizar su saldo en el kiosco escolar, debés firmar la autorización digital informada.
            </Text>
            <Button
              label="Firmar Autorización Digital Ahora"
              onPress={() => setShowConsentModal(true)}
              variant="primary"
              style={styles.actionBtn}
              testID="btn-open-sign-consent"
            />
          </View>
        )}

        {consentStatus === 'GRANTED' && (
          <View style={styles.alertGrantedBox} testID="banner-consent-granted">
            <View style={styles.alertTitleRow}>
              <CheckCircle2 size={16} color={colors.economy.moneyMintDark} />
              <Text style={styles.alertGrantedTitle}>Cuenta Escolar Habilitada</Text>
            </View>
            <Text style={styles.alertGrantedText}>
              El alumno puede pagar en el recreo con QR respetando los topes que fijes. Podés revocar esta autorización en cualquier momento.
            </Text>
            <Button
              label="Revocar Consentimiento Parental"
              onPress={() => setShowRevocationModal(true)}
              variant="danger"
              style={styles.actionBtn}
              testID="btn-open-revoke-consent"
            />
          </View>
        )}

        {consentStatus === 'REVOKED' && (
          <View style={styles.alertRevokedBox} testID="banner-consent-revoked">
            <View style={styles.alertTitleRow}>
              <ShieldAlert size={16} color={colors.status.danger} />
              <Text style={styles.alertRevokedTitle}>Consentimiento Revocado</Text>
            </View>
            <Text style={styles.alertRevokedText}>
              La cuenta del alumno se encuentra pausada para pagos y transacciones escolares.
            </Text>
            <Button
              label="Reactivar Consentimiento Escolar"
              onPress={() => setShowConsentModal(true)}
              variant="mint"
              style={styles.actionBtn}
              testID="btn-reactivate-consent"
            />
          </View>
        )}
      </View>

      {/* PARENT QUICK CONTROLS & WALLET MANAGEMENT (Wave 2) */}
      <View style={styles.controlsSection} testID="parent-quick-controls">
        <Text style={styles.controlsSectionTitle}>Billetera Escolar y Seguridad</Text>
        <Text style={styles.controlsSectionSubtitle}>
          Gestioná el saldo 1 a 1, fijá topes de gasto por día y revisá compras en tiempo real.
        </Text>

        <View style={styles.controlsGrid}>
          <Button
            label="Cargar Saldo 1 a 1"
            icon={<CreditCard size={18} color="#FFFFFF" />}
            onPress={() => router.push('/(parent)/wallet/top-up')}
            variant="mint"
            testID="btn-parent-topup"
          />
          <Button
            label="Límites y Controles"
            icon={<Sliders size={18} color="#FFFFFF" />}
            onPress={() => router.push('/(parent)/controls/spending-limits')}
            variant="primary"
            testID="btn-parent-limits"
          />
          <Button
            label="Alertas de Compra"
            icon={<Bell size={18} color={colors.brand.primaryDark} />}
            onPress={() => router.push('/(parent)/notifications')}
            variant="secondary"
            testID="btn-parent-notifications"
          />
          <Button
            label="Resumen Semanal de Gastos"
            icon={<BarChart3 size={18} color={colors.brand.primaryDark} />}
            onPress={() => router.push('/(parent)/reports/weekly-summary')}
            variant="secondary"
            testID="btn-parent-weekly-summary"
          />
        </View>
      </View>

      {/* QUICK PREVIEW / SWITCH TO STUDENT VIEW */}
      <View style={styles.switchSection}>
        <Text style={styles.switchSectionTitle}>Simulador de Experiencia del Alumno</Text>
        <Text style={styles.switchSectionSubtitle}>
          Ingresá para verificar cómo ve la app tu hijo/a según el estado de su consentimiento.
        </Text>
        <Button
          label={`Ingresar como Alumno (${student?.fullName.split(' ')[0] || 'Mateo'})`}
          onPress={handleNavigateToStudent}
          variant="secondary"
          testID="btn-preview-student-mode"
        />
      </View>

      {student && (
        <ConsentRevocationModal
          visible={showRevocationModal}
          studentId={student.id}
          studentName={student.fullName}
          onRevoked={handleRevocationSuccess}
          onClose={() => setShowRevocationModal(false)}
        />
      )}

      {student && (
        <DigitalConsentModal
          visible={showConsentModal}
          student={student}
          parentName={parentName}
          institutionName={institutionName}
          onConsentGranted={handleConsentGranted}
          onClose={() => setShowConsentModal(false)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
  },
  institutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 20,
  },
  institutionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  siblingSelectorBar: {
    marginBottom: 16,
  },
  siblingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  siblingSelectorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  siblingChipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  siblingChip: {
    backgroundColor: colors.background.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.brand.primarySoft,
  },
  siblingChipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  siblingChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  siblingChipName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
  },
  siblingChipNameActive: {
    color: colors.text.inverse,
  },
  siblingChipGrade: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  siblingChipGradeActive: {
    color: colors.brand.primarySoft,
  },
  studentCard: {
    backgroundColor: colors.background.surface,
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  studentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  studentLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.brand.primaryDark,
    marginTop: 2,
  },
  studentGrade: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  alertPendingBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: colors.economy.pointsYellow,
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertPendingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  alertPendingText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  alertGrantedBox: {
    backgroundColor: colors.economy.moneyMintSoft,
    borderWidth: 1.5,
    borderColor: colors.economy.moneyMint,
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  alertGrantedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.economy.moneyMintDark,
  },
  alertGrantedText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  alertRevokedBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: colors.status.danger,
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  alertRevokedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.status.danger,
  },
  alertRevokedText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: 8,
  },
  switchSection: {
    backgroundColor: colors.brand.primarySoft,
    padding: 20,
    borderRadius: 20,
    gap: 8,
  },
  switchSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.brand.primaryDark,
  },
  switchSectionSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  controlsSection: {
    backgroundColor: colors.background.surface,
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  controlsSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  controlsSectionSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  controlsGrid: {
    gap: 12,
  },
});
