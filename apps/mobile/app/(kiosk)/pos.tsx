import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/shared/theme/colors.js';
import { Button } from '../../src/shared/ui/Button.js';
import { Pill } from '../../src/shared/ui/Pill.js';
import { mockApiClient, type MockCatalogProduct } from '../../src/shared/api/mock-client.js';
import { ChargeQrRequestSchema } from '@cambiazo/shared';

interface SelectedItem {
  product: MockCatalogProduct;
  quantity: number;
}

export default function KioskPosScreen() {
  const router = useRouter();
  const [catalog, setCatalog] = useState<MockCatalogProduct[]>([]);
  const [cart, setCart] = useState<Map<string, SelectedItem>>(new Map());
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [chargeSuccess, setChargeSuccess] = useState<{
    totalCharged: number;
    studentName: string;
    remainingDailyLimit: number;
    itemsSummary: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const products = mockApiClient.getCatalogProducts();
    setCatalog(products);
  }, []);

  const totalCents = Array.from(cart.values()).reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0
  );
  const totalArs = (totalCents / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const handleSelectProduct = (product: MockCatalogProduct) => {
    setErrorMessage(null);
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(product.id);
      if (existing) {
        next.set(product.id, {
          product,
          quantity: existing.quantity + 1,
        });
      } else {
        next.set(product.id, {
          product,
          quantity: 1,
        });
      }
      return next;
    });
  };

  const handleRemoveProduct = (productId: string) => {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(productId);
      if (existing && existing.quantity > 1) {
        next.set(productId, {
          product: existing.product,
          quantity: existing.quantity - 1,
        });
      } else {
        next.delete(productId);
      }
      return next;
    });
  };

  const handleKeyPress = (digit: string) => {
    setErrorMessage(null);
    if (enteredCode.length < 6) {
      setEnteredCode((prev) => prev + digit);
    }
  };

  const handleKeyBackspace = () => {
    setEnteredCode((prev) => prev.slice(0, -1));
  };

  const handleSimulateQuickScan = async () => {
    // Quickly generate or fetch token for Mateo (studentId: 22222222-2222-4222-8222-222222222222)
    const tokenRes = await mockApiClient.generateQrPaymentToken('22222222-2222-4222-8222-222222222222');
    if (tokenRes.success && tokenRes.backupCode) {
      setEnteredCode(tokenRes.backupCode);
    } else {
      setErrorMessage(tokenRes.error || 'No se pudo simular el escaneo');
    }
  };

  const handleExecuteCharge = async () => {
    if (cart.size === 0) {
      setErrorMessage('Seleccioná al menos un producto para cobrar.');
      return;
    }

    if (enteredCode.length !== 6) {
      setErrorMessage('Ingresá el código de 6 dígitos del alumno o escaneá el QR.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const items = Array.from(cart.values()).map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    const idempotencyKey = `pos-charge-${Date.now()}-${enteredCode}`;

    // Validate with ChargeQrRequestSchema
    const validation = ChargeQrRequestSchema.safeParse({
      paymentTokenOrCode: enteredCode,
      items,
      idempotencyKey,
    });

    if (!validation.success) {
      setIsProcessing(false);
      setErrorMessage(validation.error.errors[0]?.message || 'Datos de cobro inválidos.');
      return;
    }

    const res = await mockApiClient.chargeQrPayment({
      paymentTokenOrCode: enteredCode,
      items,
      idempotencyKey,
    });

    setIsProcessing(false);

    if (!res.success) {
      setErrorMessage(res.error || 'No se pudo procesar el cobro.');
      return;
    }

    setChargeSuccess({
      totalCharged: (res.totalChargedCents ?? totalCents) / 100,
      studentName: res.studentName || 'Alumno',
      remainingDailyLimit: (res.remainingDailyLimitCents ?? 0) / 100,
      itemsSummary: res.itemsSummary || 'Productos del recreo',
    });
  };

  const handleNextStudent = () => {
    setCart(new Map());
    setEnteredCode('');
    setErrorMessage(null);
    setChargeSuccess(null);
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      testID="screen-kiosk-pos"
    >
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.replace('/(kiosk)')}
          style={styles.backButton}
          testID="btn-pos-back"
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Pill label="Cobro Recreo < 5s" variant="mint" icon="⚡" />
      </View>

      <Text style={styles.title}>Modo Kiosquero POS</Text>
      <Text style={styles.subtitle}>
        Cobrá en menos de 3 toques y menos de 5 segundos en la fila del recreo.
      </Text>

      {/* Success Green Confirmation Screen (sub-5s completion) */}
      {chargeSuccess ? (
        <View style={styles.confirmationSurface} testID="surface-charge-success">
          <View style={styles.successBadge}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>¡Cobro Exitoso!</Text>
          </View>

          <Text style={styles.chargedAmount} testID="text-charged-amount">
            ${chargeSuccess.totalCharged.toLocaleString('es-AR')}
          </Text>

          <View style={styles.successDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Alumno:</Text>
              <Text style={styles.detailValue} testID="text-success-student-name">
                {chargeSuccess.studentName}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Detalle:</Text>
              <Text style={styles.detailValue}>{chargeSuccess.itemsSummary}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Límite diario restante:</Text>
              <Text style={styles.detailValueMint} testID="text-remaining-limit">
                ${chargeSuccess.remainingDailyLimit.toLocaleString('es-AR')}
              </Text>
            </View>
          </View>

          <Button
            label="Siguiente Alumno (Nuevo Cobro)"
            onPress={handleNextStudent}
            variant="mint"
            style={styles.nextStudentBtn}
            testID="btn-next-student"
          />
        </View>
      ) : (
        <>
          {/* STEP 1: Giant Product Selector (Catalog) */}
          <View style={styles.stepSection} testID="step-select-products">
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepTitle}>Seleccioná Productos</Text>
            </View>

            <View style={styles.catalogGrid} testID="catalog-products-grid">
              {catalog.map((product) => {
                const cartItem = cart.get(product.id);
                const quantity = cartItem?.quantity || 0;
                const priceFormatted = (product.priceCents / 100).toLocaleString('es-AR');
                return (
                  <TouchableOpacity
                    key={product.id}
                    onPress={() => handleSelectProduct(product)}
                    style={[
                      styles.productCard,
                      quantity > 0 && styles.productCardSelected,
                    ]}
                    activeOpacity={0.7}
                    testID={`btn-product-${product.id}`}
                  >
                    <Text style={styles.productIcon}>{product.icon}</Text>
                    <Text style={styles.productName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={styles.productPrice}>${priceFormatted}</Text>

                    {quantity > 0 && (
                      <View style={styles.quantityBadge} testID={`badge-qty-${product.id}`}>
                        <Text style={styles.quantityText}>{quantity}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Total Bar */}
            <View style={styles.totalBar} testID="bar-total-amount">
              <Text style={styles.totalLabel}>
                Total ({Array.from(cart.values()).reduce((acc, i) => acc + i.quantity, 0)} productos):
              </Text>
              <Text style={styles.totalValue} testID="text-cart-total-ars">
                ${totalArs}
              </Text>
            </View>
          </View>

          {/* STEP 2: Instant QR Scanner / 6-Digit Keypad */}
          <View style={styles.stepSection} testID="step-scan-or-code">
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepTitle}>Identificá al Alumno</Text>
            </View>

            {/* Instant Scanner Simulator */}
            <TouchableOpacity
              onPress={handleSimulateQuickScan}
              style={styles.quickScanButton}
              activeOpacity={0.8}
              testID="btn-quick-scan-sim"
            >
              <Text style={styles.quickScanIcon}>📷</Text>
              <Text style={styles.quickScanText}>Simular Escaneo Instantáneo QR</Text>
            </TouchableOpacity>

            {/* 6-Digit Code Display */}
            <View style={styles.codeDisplayBox} testID="box-code-display">
              <Text style={styles.codeDisplayText}>
                {enteredCode ? enteredCode.padEnd(6, '•') : '••••••'}
              </Text>
            </View>

            {/* Numeric Keypad for Rapid Dictation */}
            <View style={styles.keypad} testID="keypad-grid">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => {
                const isAction = key === 'C' || key === '⌫';
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      if (key === 'C') {
                        setEnteredCode('');
                      } else if (key === '⌫') {
                        handleKeyBackspace();
                      } else {
                        handleKeyPress(key);
                      }
                    }}
                    style={[styles.keypadKey, isAction && styles.keypadKeyAction]}
                    activeOpacity={0.6}
                    testID={`keypad-key-${key}`}
                  >
                    <Text style={[styles.keypadKeyText, isAction && styles.keypadKeyActionText]}>
                      {key}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Error Message */}
          {errorMessage && (
            <View style={styles.errorBox} testID="box-pos-error">
              <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
            </View>
          )}

          {/* STEP 3: Charge Button (Tap 3) */}
          <View style={styles.chargeActionContainer}>
            <Button
              label={
                isProcessing
                  ? 'Cobrando...'
                  : `Cobrar $${totalArs} (3er Toque)`
              }
              onPress={handleExecuteCharge}
              variant="mint"
              disabled={isProcessing || totalCents <= 0 || enteredCode.length !== 6}
              testID="btn-pos-charge-submit"
            />
          </View>
        </>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
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
    marginBottom: 20,
  },
  stepSection: {
    backgroundColor: colors.background.surface,
    padding: 18,
    borderRadius: 20,
    marginBottom: 18,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.primary,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 15,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  catalogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  productCard: {
    width: '48%',
    backgroundColor: colors.background.canvas,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.background.divider,
    position: 'relative',
    minHeight: 100,
    justifyContent: 'center',
  },
  productCardSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primarySoft,
  },
  productIcon: {
    fontSize: 30,
    marginBottom: 4,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.economy.moneyMintDark,
  },
  quantityBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.brand.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.background.divider,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.economy.moneyMintDark,
  },
  quickScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primarySoft,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginBottom: 14,
  },
  quickScanIcon: {
    fontSize: 20,
  },
  quickScanText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand.primaryDark,
  },
  codeDisplayBox: {
    backgroundColor: colors.background.canvas,
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  codeDisplayText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 8,
    color: colors.brand.primaryDark,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  keypadKey: {
    width: '31%',
    height: 48,
    backgroundColor: colors.background.canvas,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background.divider,
  },
  keypadKeyAction: {
    backgroundColor: '#F1F5F9',
  },
  keypadKeyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  keypadKeyActionText: {
    color: colors.status.danger,
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: colors.status.danger,
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  errorText: {
    color: colors.status.danger,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  chargeActionContainer: {
    marginTop: 4,
  },
  confirmationSurface: {
    backgroundColor: colors.economy.moneyMintSoft,
    borderWidth: 2,
    borderColor: colors.economy.moneyMint,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  successBadge: {
    alignItems: 'center',
    gap: 6,
  },
  successIcon: {
    fontSize: 48,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.economy.moneyMintDark,
  },
  chargedAmount: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.economy.moneyMintDark,
    letterSpacing: -1,
  },
  successDetails: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  detailValueMint: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.economy.moneyMintDark,
  },
  nextStudentBtn: {
    width: '100%',
    minHeight: 54,
  },
});
