'use client';

import React, { useState, useEffect } from 'react';
import {
  CatalogProduct,
  ChargeQrRequestInput,
  KioskSale,
} from '@/shared/api/types';
import { apiClient } from '@/shared/api/api-client';
import { Button } from '@/shared/ui/Button';
import { Surface } from '@/shared/ui/Surface';
import {
  CreditCard,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { isParentBlockable } from '@/entities/catalog';

interface PosCheckoutTerminalProps {
  products: CatalogProduct[];
  onSaleCompleted: (sale: KioskSale) => void;
  institutionId: string;
}

interface CartItem {
  product: CatalogProduct;
  quantity: number;
}

export const PosCheckoutTerminal: React.FC<PosCheckoutTerminalProps> = ({
  products,
  onSaleCompleted,
  institutionId,
}) => {
  const [paymentCode, setPaymentCode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<KioskSale | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate unique idempotencyKey on mount or after sale
  const generateNewIdempotencyKey = () => {
    const key =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `pos-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setIdempotencyKey(key);
  };

  useEffect(() => {
    generateNewIdempotencyKey();
  }, []);

  // Quick add product to cart
  const handleAddToCart = (product: CatalogProduct) => {
    setErrorMessage(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setErrorMessage(`Stock máximo alcanzado para ${product.name}`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      if (product.stock < 1) {
        setErrorMessage(`Sin stock disponible para ${product.name}`);
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setErrorMessage(null);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              setErrorMessage(`Stock máximo alcanzado para ${item.product.name}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setErrorMessage(null);
  };

  // Calculations
  const totalCents = cart.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0
  );
  const totalPesosFormatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(totalCents / 100);

  // Submit charge
  const handleProcessSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = paymentCode.trim().replace(/\D/g, '');
    if (cleanCode.length < 4 || cleanCode.length > 8) {
      setErrorMessage('Ingresa un código de alumno de 6 dígitos válido.');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Selecciona al menos un producto para cobrar.');
      return;
    }

    setIsProcessing(true);
    try {
      const payload: ChargeQrRequestInput = {
        paymentTokenOrCode: cleanCode,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        idempotencyKey,
      };

      const sale = await apiClient.processKioskCharge(payload, institutionId);
      setLastCompletedSale(sale);
      onSaleCompleted(sale);

      // Reset state for next student
      setCart([]);
      setPaymentCode('');
      generateNewIdempotencyKey();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Error al procesar el cobro en la caja escolar.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismissSuccess = () => {
    setLastCompletedSale(null);
  };

  const activeProducts = products.filter((p) => p.isActive && p.stock > 0);

  return (
    <Surface className="p-6">
      <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand-dark flex items-center justify-center font-bold">
            <CreditCard size={20} />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-text-primary">
              Caja Web Auxiliar (6 Dígitos)
            </h2>
            <p className="text-xs text-text-secondary">
              Terminal de cobro rápido para el recreo escolar • 0% comisión
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">
            Idempotency Key
          </span>
          <span className="text-[10px] text-slate-400 font-mono" title={idempotencyKey}>
            {idempotencyKey.substring(0, 16)}...
          </span>
        </div>
      </div>

      {/* Success Banner */}
      {lastCompletedSale && (
        <div className="p-4 mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-emerald-900">
                  ¡Cobro exitoso de{' '}
                  {new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                    maximumFractionDigits: 0,
                  }).format(lastCompletedSale.totalAmountCents / 100)}
                  !
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  0% Comisión
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                {lastCompletedSale.studentName} • Código #{lastCompletedSale.paymentCode}
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={handleDismissSuccess}>
            Aceptar
          </Button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 mb-5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs text-red-700 animate-in fade-in">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleProcessSale} className="flex flex-col gap-6">
        {/* Step 1: 6-Digit Payment Code */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="pos-payment-code"
            className="text-sm font-bold text-text-primary flex items-center justify-between"
          >
            <span>1. Código de Pago del Alumno (6 dígitos)</span>
            <span className="text-xs font-normal text-text-secondary">
              Generado en la app del alumno
            </span>
          </label>
          <div className="relative">
            <input
              id="pos-payment-code"
              type="text"
              inputMode="numeric"
              maxLength={8}
              placeholder="Ej. 482910"
              value={paymentCode}
              onChange={(e) => setPaymentCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center tracking-[0.3em] font-mono text-2xl font-extrabold py-3.5 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-brand-primary focus:bg-white focus:outline-none transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-base placeholder:font-normal"
              required
            />
          </div>
        </div>

        {/* Step 2: Quick Items Picker */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-text-primary">
              2. Seleccionar Productos del Recreo
            </span>
            <span className="text-xs text-text-secondary">
              Toca para agregar al carrito
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1 bg-slate-50/50 rounded-2xl border border-slate-100">
            {activeProducts.map((p) => {
              const inCart = cart.find((i) => i.product.id === p.id);
              const isBlockable = isParentBlockable(p.category);

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAddToCart(p)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all select-none hover:border-brand-primary hover:bg-white ${
                    inCart
                      ? 'border-brand-primary bg-purple-50/50 shadow-sm'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold text-text-secondary truncate">
                        {p.stock} disp.
                      </span>
                      {isBlockable && (
                        <span
                          className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"
                          title="Golosina bloqueable"
                        />
                      )}
                    </div>
                    <span className="font-bold text-xs text-text-primary line-clamp-1">
                      {p.name}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-xs font-extrabold text-brand-primary tabular-nums">
                      ${(p.priceCents / 100).toLocaleString('es-AR')}
                    </span>
                    {inCart ? (
                      <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-[11px] font-bold flex items-center justify-center">
                        {inCart.quantity}
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs flex items-center justify-center">
                        +
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Current Order Summary */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Detalle del Pedido ({cart.reduce((s, i) => s + i.quantity, 0)} ítems)
            </span>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="text-xs text-red-600 hover:text-red-700 font-semibold"
              >
                Vaciar
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="py-4 text-center text-text-secondary text-xs">
              No hay productos seleccionados. Toca los botones de arriba para armar el pedido.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 truncate">
                    <span className="font-bold text-text-primary">
                      {item.product.name}
                    </span>
                    <span className="text-text-secondary ml-1">
                      (${(item.product.priceCents / 100).toLocaleString('es-AR')} c/u)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 border border-slate-300 rounded-lg bg-white px-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                        className="p-1 hover:text-brand-primary"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-bold text-xs px-1 tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        className="p-1 hover:text-brand-primary"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <span className="font-extrabold text-text-primary min-w-[60px] text-right tabular-nums">
                      ${((item.product.priceCents * item.quantity) / 100).toLocaleString('es-AR')}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      aria-label="Eliminar ítem"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Big Total in Real Pesos */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-text-secondary block font-semibold">
                Total a Cobrar
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">
                0% Comisión • 100% Neto al Kiosco
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tabular-nums">
                {totalPesosFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* Giant Ergonomic Checkout Button (AGENTS.md: min-h-[52px] to 56px for recreo!) */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isProcessing}
          disabled={cart.length === 0 || !paymentCode.trim()}
          className="w-full text-base sm:text-lg min-h-[56px] shadow-md"
        >
          <Sparkles size={18} className="mr-2" />
          <span>Confirmar Cobro ({totalPesosFormatted})</span>
        </Button>
      </form>
    </Surface>
  );
};
