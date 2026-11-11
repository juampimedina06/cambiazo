import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { colors } from '../theme/colors';

export interface SelectOption {
  label: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export interface SelectPickerFieldProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  testID?: string;
}

export const SelectPickerField: React.FC<SelectPickerFieldProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = 'Seleccionar opción',
  error,
  helperText,
  testID,
}) => {
  const [visible, setVisible] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (val: string) => {
    onChange(val);
    setVisible(false);
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={[styles.trigger, error ? styles.triggerError : undefined]}
        onPress={() => setVisible(true)}
        activeOpacity={0.75}
        testID={testID}
      >
        <View style={styles.triggerLeft}>
          {selectedOption?.icon ? (
            typeof selectedOption.icon === 'string' ? (
              <Text style={styles.optionIcon}>{selectedOption.icon}</Text>
            ) : (
              <View style={styles.optionIconWrapper}>{selectedOption.icon}</View>
            )
          ) : null}
          <View>
            <Text style={selectedOption ? styles.valueText : styles.placeholderText}>
              {selectedOption ? selectedOption.label : placeholder}
            </Text>
            {selectedOption?.subtitle ? (
              <Text style={styles.subtitleText}>{selectedOption.subtitle}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.chevronBadge}>
          <ChevronDown size={14} color={colors.brand.primaryDark} />
        </View>
      </TouchableOpacity>

      {error ? (
        <Text style={styles.errorText} testID={testID ? `${testID}-error` : undefined}>
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet} testID={testID ? `${testID}-modal` : undefined}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>{label || 'Seleccionar Opción'}</Text>
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                    onPress={() => handleSelect(opt.value)}
                    activeOpacity={0.7}
                    testID={`select-option-${opt.value}`}
                  >
                    <View style={styles.optionItemLeft}>
                      {opt.icon ? (
                        typeof opt.icon === 'string' ? (
                          <Text style={styles.optionItemIcon}>{opt.icon}</Text>
                        ) : (
                          <View style={styles.optionIconWrapper}>{opt.icon}</View>
                        )
                      ) : null}
                      <View>
                        <Text
                          style={[
                            styles.optionItemLabel,
                            isSelected && styles.optionItemLabelSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                        {opt.subtitle ? (
                          <Text style={styles.optionItemSubtitle}>{opt.subtitle}</Text>
                        ) : null}
                      </View>
                    </View>
                    {isSelected ? <Check size={18} color={colors.brand.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  trigger: {
    minHeight: 54,
    backgroundColor: colors.background.surface,
    borderWidth: 1.5,
    borderColor: colors.brand.primarySoft,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerError: {
    borderColor: colors.status.danger,
    backgroundColor: '#FFF5F5',
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  optionIcon: {
    fontSize: 20,
  },
  optionIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  subtitleText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 1,
  },
  placeholderText: {
    fontSize: 15,
    color: colors.text.muted,
  },
  chevronBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brand.primaryDark,
  },
  errorText: {
    fontSize: 13,
    color: colors.status.danger,
    marginTop: 4,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 27, 75, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.background.divider,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.background.canvas,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  optionsList: {
    maxHeight: 360,
  },
  optionItem: {
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: colors.background.canvas,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionItemSelected: {
    backgroundColor: colors.brand.primarySoft,
    borderColor: colors.brand.primary,
  },
  optionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionItemIcon: {
    fontSize: 20,
  },
  optionItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  optionItemLabelSelected: {
    fontWeight: '800',
    color: colors.brand.primaryDark,
  },
  optionItemSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  checkMark: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.brand.primary,
  },
});

