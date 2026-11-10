import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors } from '../theme/colors';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  numericOnly?: boolean;
  testID?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  numericOnly = false,
  onChangeText,
  keyboardType,
  testID,
  style,
  ...textInputProps
}) => {
  const handleChangeText = (text: string) => {
    if (!onChangeText) return;
    if (numericOnly) {
      onChangeText(text.replace(/\D/g, ''));
    } else {
      onChangeText(text);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : undefined,
          style,
        ]}
        placeholderTextColor={colors.text.muted}
        keyboardType={numericOnly ? 'number-pad' : keyboardType}
        onChangeText={handleChangeText}
        testID={testID}
        {...textInputProps}
      />
      {error ? (
        <Text style={styles.errorText} testID={testID ? `${testID}-error` : undefined}>
          {error}
        </Text>
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
  input: {
    minHeight: 52,
    backgroundColor: colors.background.surface,
    borderWidth: 1.5,
    borderColor: colors.brand.primarySoft,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  inputError: {
    borderColor: colors.status.danger,
    backgroundColor: '#FFF5F5',
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
