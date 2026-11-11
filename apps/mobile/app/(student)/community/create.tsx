import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Gift,
  Handshake,
  BookOpen,
  Pencil,
  Cpu,
  Briefcase,
  Palette,
} from 'lucide-react-native';
import {
  CreateExchangeItemSchema,
  type ExchangeMode,
  type CreateExchangeItemDto,
} from '@cambiazo/shared';
import { colors } from '../../../src/shared/theme/colors';
import { Pill } from '../../../src/shared/ui/Pill';
import { Button } from '../../../src/shared/ui/Button';
import { SelectPickerField, type SelectOption } from '../../../src/shared/ui/SelectPickerField';
import { authStore, type AuthState } from '../../../src/shared/store/auth-store';
import { mockApiClient } from '../../../src/shared/api/mock-client';

const categoryOptions = ['Libros', 'Útiles', 'Tecnología', 'Accesorios', 'Arte y Música'];

const categorySelectOptions: SelectOption[] = [
  {
    label: 'Libros y Manuales',
    value: 'Libros',
    subtitle: 'Novelas, diccionarios y textos escolares',
    icon: <BookOpen size={18} color={colors.brand.primary} />,
  },
  {
    label: 'Útiles Escolares',
    value: 'Útiles',
    subtitle: 'Reglas, cartucheras, compás, carpetas',
    icon: <Pencil size={18} color={colors.brand.primary} />,
  },
  {
    label: 'Tecnología Educativa',
    value: 'Tecnología',
    subtitle: 'Calculadoras científicas y accesorios',
    icon: <Cpu size={18} color={colors.brand.primary} />,
  },
  {
    label: 'Accesorios y Mochilas',
    value: 'Accesorios',
    subtitle: 'Mochilas, botellas térmicas, loncheras',
    icon: <Briefcase size={18} color={colors.brand.primary} />,
  },
  {
    label: 'Arte y Música',
    value: 'Arte y Música',
    subtitle: 'Acuarelas, pinceles, instrumentos',
    icon: <Palette size={18} color={colors.brand.primary} />,
  },
];

export default function CreateExchangeItemScreen() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Útiles');
  const [mode, setMode] = useState<ExchangeMode>('BARTER');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1588072432836-e10032774350?w=400');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    return authStore.subscribe((state) => {
      setAuthState(state);
    });
  }, []);

  const student = authState.student || mockApiClient.getStudent('22222222-2222-4222-8222-222222222222');
  const institution = authState.institution || { id: 'e28bb18a-66fe-4f8e-9092-2df283f55001', name: 'Colegio Manuel Belgrano' };
  const studentId = student?.id || '22222222-2222-4222-8222-222222222222';
  const institutionId = student?.institutionId || institution.id;

  const handleSubmit = async () => {
    setErrorMessage('');

    const payload: CreateExchangeItemDto = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      mode,
      photoUrls: photoUrl.trim() ? [photoUrl.trim()] : [],
    };

    // Strict validation against CreateExchangeItemSchema
    const validation = CreateExchangeItemSchema.safeParse(payload);
    if (!validation.success) {
      setErrorMessage(validation.error.errors[0]?.message || 'Verificá los datos del útil escolar.');
      return;
    }

    const res = await mockApiClient.createExchangeItem(studentId, institutionId, validation.data);
    if (!res.success) {
      setErrorMessage(res.error || 'Ocurrió un error al publicar el útil.');
      return;
    }

    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <View style={styles.successContainer} testID="success-create-item-screen">
        <CheckCircle2 size={56} color={colors.economy.moneyMintDark} />
        <Text style={styles.successTitle}>¡Útil Enviado a Moderación!</Text>
        <Text style={styles.successSubtitle}>
          Tu publicación quedó registrada en estado PENDIENTE. Quedará visible en el feed escolar en cuanto el directivo o moderador escolar la apruebe.
        </Text>
        <View style={styles.successReminderBox}>
          <View style={styles.reminderTitleRow}>
            <MapPin size={16} color="#1E40AF" />
            <Text style={styles.reminderTitle}>Recordatorio de Entrega</Text>
          </View>
          <Text style={styles.reminderText}>
            La entrega física de los útiles se realiza siempre en el Punto de Entrega Escolar Moderado del colegio bajo supervisión docente.
          </Text>
        </View>
        <Button
          label="Volver a la Comunidad Escolar"
          onPress={() => router.replace('/(student)/community')}
          variant="primary"
          style={{ width: '100%', marginTop: 12 }}
          testID="btn-success-back-community"
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      testID="screen-community-create"
    >
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          testID="btn-create-back"
        >
          <ArrowLeft size={16} color={colors.brand.primary} />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <Pill
          label="Publicar"
          variant="primary"
          icon={<Plus size={13} color={colors.brand.primary} />}
        />
      </View>

      <Text style={styles.title}>Publicar Útil Escolar</Text>
      <Text style={styles.subtitle}>
        Compartí libros, útiles o accesorios con tus compañeros de {institution.name}
      </Text>

      {/* Mandatory Moderation Warning Banner */}
      <View style={styles.moderationNotice} testID="banner-moderation-disclaimer">
        <AlertTriangle size={22} color="#D97706" />
        <View style={styles.noticeTextWrapper}>
          <Text style={styles.noticeTitle}>Aviso de Moderación y Entrega Escolar</Text>
          <Text style={styles.noticeText}>
            Tu publicación quedará en estado PENDIENTE hasta ser revisada por el directivo escolar. La entrega física se realiza exclusivamente en el Punto de Entrega Escolar Moderado.
          </Text>
        </View>
      </View>

      {/* Form Fields */}
      <View style={styles.formWrapper}>
        {errorMessage ? (
          <Text style={styles.errorBanner} testID="text-create-error">
            {errorMessage}
          </Text>
        ) : null}

        {/* 1. Title */}
        <Text style={styles.fieldLabel}>Nombre del Útil Escolar</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Diccionario Escolar Español o Juego de Reglas"
          placeholderTextColor={colors.text.muted}
          value={title}
          onChangeText={setTitle}
          testID="input-item-title"
        />

        {/* 2. Mode Picker (BARTER, DONATION, LOAN) */}
        <Text style={styles.fieldLabel}>Modo de Intercambio</Text>
        <View style={styles.modePickerRow} testID="picker-exchange-mode">
          {(['BARTER', 'DONATION', 'LOAN'] as const).map((m) => {
            const isSelected = mode === m;
            const label =
              m === 'BARTER'
                ? 'Trueque'
                : m === 'DONATION'
                ? 'Donación'
                : 'Préstamo';
            const IconComp =
              m === 'BARTER' ? RefreshCw : m === 'DONATION' ? Gift : Handshake;

            return (
              <TouchableOpacity
                key={m}
                style={[styles.modeButton, isSelected && styles.modeButtonSelected]}
                onPress={() => setMode(m)}
                testID={`btn-mode-${m.toLowerCase()}`}
              >
                <IconComp
                  size={15}
                  color={isSelected ? colors.brand.primaryDark : colors.text.secondary}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    isSelected && styles.modeButtonTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. Category */}
        <SelectPickerField
          label="Categoría del Útil"
          value={category}
          options={categorySelectOptions}
          onChange={setCategory}
          placeholder="Seleccionar categoría"
          testID="select-item-category"
        />
        <View style={styles.categoriesRow}>
          {categoryOptions.map((cat) => {
            const isSelected = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                onPress={() => setCategory(cat)}
                testID={`chip-category-${cat.toLowerCase()}`}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. Description */}
        <Text style={styles.fieldLabel}>Descripción y Estado del Útil</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describí el estado (ej. nuevo, poco uso, completo, etc.)"
          placeholderTextColor={colors.text.muted}
          multiline={true}
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
          testID="input-item-description"
        />

        {/* 5. Photo URL */}
        <Text style={styles.fieldLabel}>Foto o Imagen del Útil (URL)</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor={colors.text.muted}
          value={photoUrl}
          onChangeText={setPhotoUrl}
          testID="input-item-photo"
        />

        {/* Submit Button */}
        <View style={styles.submitWrapper}>
          <Button
            label="Enviar para Moderación Escolar"
            onPress={handleSubmit}
            variant="primary"
            testID="btn-submit-exchange-item"
          />
        </View>
      </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 16,
  },
  moderationNotice: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: colors.status.warning,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  noticeTextWrapper: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9A3412',
    marginBottom: 2,
  },
  noticeText: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  formWrapper: {
    gap: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 4,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.background.divider,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text.primary,
    backgroundColor: colors.background.surface,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  modePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.background.surface,
    borderWidth: 1.5,
    borderColor: colors.background.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primarySoft,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  modeButtonTextSelected: {
    color: colors.brand.primaryDark,
    fontWeight: '800',
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.background.surface,
    borderWidth: 1.5,
    borderColor: colors.background.divider,
  },
  categoryChipSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  categoryChipTextSelected: {
    color: colors.text.inverse,
    fontWeight: '700',
  },
  submitWrapper: {
    marginTop: 16,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    color: colors.status.danger,
    padding: 12,
    borderRadius: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.brand.primaryDark,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  successReminderBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    width: '100%',
  },
  reminderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reminderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
  },
  reminderText: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 16,
  },
});
