import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import { Button } from './Button';

export interface DatePickerFieldProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (isoDate: string) => void;
  error?: string;
  helperText?: string;
  minYear?: number;
  maxYear?: number;
  placeholder?: string;
  testID?: string;
}

const MONTHS = [
  { num: 1, name: 'Enero', short: 'Ene' },
  { num: 2, name: 'Febrero', short: 'Feb' },
  { num: 3, name: 'Marzo', short: 'Mar' },
  { num: 4, name: 'Abril', short: 'Abr' },
  { num: 5, name: 'Mayo', short: 'May' },
  { num: 6, name: 'Junio', short: 'Jun' },
  { num: 7, name: 'Julio', short: 'Jul' },
  { num: 8, name: 'Agosto', short: 'Ago' },
  { num: 9, name: 'Septiembre', short: 'Sep' },
  { num: 10, name: 'Octubre', short: 'Oct' },
  { num: 11, name: 'Noviembre', short: 'Nov' },
  { num: 12, name: 'Diciembre', short: 'Dic' },
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseIsoDate(iso: string, fallbackYear: number): { year: number; month: number; day: number } {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = parseInt(match[1]!, 10);
    const month = Math.min(12, Math.max(1, parseInt(match[2]!, 10)));
    const maxDay = getDaysInMonth(year, month);
    const day = Math.min(maxDay, Math.max(1, parseInt(match[3]!, 10)));
    return { year, month, day };
  }
  return { year: fallbackYear, month: 5, day: 15 };
}

function formatIsoDate(year: number, month: number, day: number): string {
  const maxDay = getDaysInMonth(year, month);
  const clampedDay = Math.min(day, maxDay);
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(clampedDay).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  minYear = 2008,
  maxYear = 2020,
  placeholder = 'Seleccionar fecha de nacimiento',
  testID,
}) => {
  const [visible, setVisible] = useState(false);
  const defaultYear = Math.round((minYear + maxYear) / 2);
  const parsed = useMemo(() => parseIsoDate(value, defaultYear), [value, defaultYear]);

  const [selectedYear, setSelectedYear] = useState<number>(parsed.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(parsed.month);
  const [selectedDay, setSelectedDay] = useState<number>(parsed.day);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear]);

  const daysInCurrentMonth = useMemo(
    () => getDaysInMonth(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const days = useMemo(() => {
    const list: number[] = [];
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      list.push(d);
    }
    return list;
  }, [daysInCurrentMonth]);

  const openPicker = () => {
    const current = parseIsoDate(value, defaultYear);
    setSelectedYear(current.year);
    setSelectedMonth(current.month);
    setSelectedDay(current.day);
    setVisible(true);
  };

  const handleConfirm = () => {
    const formatted = formatIsoDate(selectedYear, selectedMonth, selectedDay);
    onChange(formatted);
    setVisible(false);
  };

  const humanReadable = useMemo(() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const p = parseIsoDate(value, defaultYear);
    const mName = MONTHS.find((m) => m.num === p.month)?.name || '';
    return `${p.day} de ${mName} de ${p.year}`;
  }, [value, defaultYear]);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={[styles.trigger, error ? styles.triggerError : undefined]}
        onPress={openPicker}
        activeOpacity={0.75}
        testID={testID}
      >
        <View style={styles.triggerLeft}>
          <Text style={styles.calendarIcon}>📅</Text>
          <View>
            <Text style={humanReadable ? styles.valueText : styles.placeholderText}>
              {humanReadable || placeholder}
            </Text>
            {humanReadable ? <Text style={styles.isoSubtext}>{value}</Text> : null}
          </View>
        </View>
        <View style={styles.badgeAction}>
          <Text style={styles.badgeActionText}>Elegir</Text>
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
            <Text style={styles.sheetTitle}>{label || 'Seleccionar Fecha'}</Text>
            <Text style={styles.sheetPreview}>
              {Math.min(selectedDay, daysInCurrentMonth)} de{' '}
              {MONTHS.find((m) => m.num === selectedMonth)?.name} de {selectedYear}
            </Text>

            <View style={styles.columnsRow}>
              {/* Day Column */}
              <View style={styles.column}>
                <Text style={styles.columnHeader}>Día</Text>
                <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
                  {days.map((d) => {
                    const isSelected = Math.min(selectedDay, daysInCurrentMonth) === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[styles.wheelItem, isSelected && styles.wheelItemSelected]}
                        onPress={() => setSelectedDay(d)}
                        testID={`date-day-${d}`}
                      >
                        <Text style={[styles.wheelItemText, isSelected && styles.wheelItemTextSelected]}>
                          {String(d).padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Month Column */}
              <View style={[styles.column, { flex: 1.4 }]}>
                <Text style={styles.columnHeader}>Mes</Text>
                <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
                  {MONTHS.map((m) => {
                    const isSelected = selectedMonth === m.num;
                    return (
                      <TouchableOpacity
                        key={m.num}
                        style={[styles.wheelItem, isSelected && styles.wheelItemSelected]}
                        onPress={() => setSelectedMonth(m.num)}
                        testID={`date-month-${m.num}`}
                      >
                        <Text style={[styles.wheelItemText, isSelected && styles.wheelItemTextSelected]}>
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Year Column */}
              <View style={styles.column}>
                <Text style={styles.columnHeader}>Año</Text>
                <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
                  {years.map((y) => {
                    const isSelected = selectedYear === y;
                    return (
                      <TouchableOpacity
                        key={y}
                        style={[styles.wheelItem, isSelected && styles.wheelItemSelected]}
                        onPress={() => setSelectedYear(y)}
                        testID={`date-year-${y}`}
                      >
                        <Text style={[styles.wheelItemText, isSelected && styles.wheelItemTextSelected]}>
                          {y}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <Button
                label="Cancelar"
                onPress={() => setVisible(false)}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                label="Confirmar Fecha"
                onPress={handleConfirm}
                variant="primary"
                style={{ flex: 1.4 }}
                testID={testID ? `${testID}-confirm` : 'btn-confirm-date'}
              />
            </View>
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
    gap: 12,
    flex: 1,
  },
  calendarIcon: {
    fontSize: 20,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  isoSubtext: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 1,
  },
  placeholderText: {
    fontSize: 15,
    color: colors.text.muted,
  },
  badgeAction: {
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeActionText: {
    fontSize: 13,
    fontWeight: '700',
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
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.background.divider,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
  },
  sheetPreview: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.brand.primary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  columnsRow: {
    flexDirection: 'row',
    gap: 10,
    height: 220,
    marginBottom: 20,
  },
  column: {
    flex: 1,
    backgroundColor: colors.background.canvas,
    borderRadius: 16,
    padding: 8,
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  columnScroll: {
    flex: 1,
  },
  wheelItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 4,
  },
  wheelItemSelected: {
    backgroundColor: colors.brand.primary,
  },
  wheelItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  wheelItemTextSelected: {
    color: colors.text.inverse,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
