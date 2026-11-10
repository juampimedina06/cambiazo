import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { colors } from '../theme/colors';

export interface NumericStepperFieldProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  presets?: number[];
  allowDirectInput?: boolean;
  error?: string;
  helperText?: string;
  testID?: string;
}

export const NumericStepperField: React.FC<NumericStepperFieldProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 999999,
  step = 1,
  prefix,
  suffix,
  presets,
  allowDirectInput = false,
  error,
  helperText,
  testID,
}) => {
  const handleDecrement = () => {
    const next = Math.max(min, value - step);
    onChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(max, value + step);
    onChange(next);
  };

  const handleTextChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    const parsed = digits ? parseInt(digits, 10) : min;
    const clamped = Math.min(max, Math.max(min, parsed));
    onChange(clamped);
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.stepperRow, error ? styles.stepperError : undefined]}>
        <TouchableOpacity
          style={[styles.stepButton, value <= min && styles.stepButtonDisabled]}
          onPress={handleDecrement}
          disabled={value <= min}
          activeOpacity={0.7}
          testID={testID ? `${testID}-dec` : undefined}
        >
          <Text style={[styles.stepButtonText, value <= min && styles.stepButtonTextDisabled]}>
            −
          </Text>
        </TouchableOpacity>

        <View style={styles.valueWrapper}>
          {prefix ? <Text style={styles.affixText}>{prefix}</Text> : null}
          {allowDirectInput ? (
            <TextInput
              style={styles.numericInput}
              value={String(value)}
              onChangeText={handleTextChange}
              keyboardType="number-pad"
              testID={testID}
            />
          ) : (
            <Text style={styles.valueText} testID={testID}>
              {value.toLocaleString('es-AR')}
            </Text>
          )}
          {suffix ? <Text style={styles.suffixText}>{suffix}</Text> : null}
        </View>

        <TouchableOpacity
          style={[styles.stepButton, styles.stepButtonPrimary, value >= max && styles.stepButtonDisabled]}
          onPress={handleIncrement}
          disabled={value >= max}
          activeOpacity={0.7}
          testID={testID ? `${testID}-inc` : undefined}
        >
          <Text
            style={[
              styles.stepButtonText,
              styles.stepButtonTextPrimary,
              value >= max && styles.stepButtonTextDisabled,
            ]}
          >
            +
          </Text>
        </TouchableOpacity>
      </View>

      {presets && presets.length > 0 ? (
        <View style={styles.presetsRow}>
          {presets.map((preset) => {
            const isSelected = value === preset;
            return (
              <TouchableOpacity
                key={preset}
                style={[styles.presetChip, isSelected && styles.presetChipSelected]}
                onPress={() => onChange(preset)}
                activeOpacity={0.75}
                testID={testID ? `${testID}-preset-${preset}` : undefined}
              >
                <Text style={[styles.presetChipText, isSelected && styles.presetChipTextSelected]}>
                  {prefix || ''}
                  {preset.toLocaleString('es-AR')}
                  {suffix ? ` ${suffix}` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
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
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.surface,
    borderWidth: 1.5,
    borderColor: colors.brand.primarySoft,
    borderRadius: 16,
    padding: 6,
  },
  stepperError: {
    borderColor: colors.status.danger,
  },
  stepButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.background.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPrimary: {
    backgroundColor: colors.brand.primarySoft,
  },
  stepButtonDisabled: {
    opacity: 0.4,
  },
  stepButtonText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
  },
  stepButtonTextPrimary: {
    color: colors.brand.primaryDark,
  },
  stepButtonTextDisabled: {
    color: colors.text.muted,
  },
  valueWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
  affixText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.brand.primaryDark,
  },
  valueText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  numericInput: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    minWidth: 70,
    paddingVertical: 4,
  },
  suffixText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
    marginLeft: 2,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.background.surface,
    borderWidth: 1.5,
    borderColor: colors.background.divider,
  },
  presetChipSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  presetChipTextSelected: {
    color: colors.text.inverse,
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
});
