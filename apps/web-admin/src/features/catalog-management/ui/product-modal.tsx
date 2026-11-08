'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import {
  CatalogProduct,
  CreateCatalogProductInput,
  ProductCategory,
  PRODUCT_CATEGORIES,
} from '@/shared/api/types';
import { CreateCatalogProductSchema } from '@cambiazo/shared';
import { CATEGORY_LABELS, isParentBlockable } from '@/entities/catalog';
import { ShieldAlert, AlertCircle } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCatalogProductInput, productId?: string) => Promise<void>;
  productToEdit?: CatalogProduct | null;
  institutionId: string;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  productToEdit,
  institutionId,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('HEALTHY_SNACK');
  const [pricePesos, setPricePesos] = useState('');
  const [stock, setStock] = useState('10');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setPricePesos((productToEdit.priceCents / 100).toString());
      setStock(productToEdit.stock.toString());
      setIsActive(productToEdit.isActive);
    } else {
      setName('');
      setCategory('HEALTHY_SNACK');
      setPricePesos('');
      setStock('25');
      setIsActive(true);
    }
    setErrors({});
  }, [productToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client pesos to cents clean conversion
    const parsedPricePesos = parseFloat(pricePesos);
    if (isNaN(parsedPricePesos) || parsedPricePesos <= 0) {
      setErrors((prev) => ({
        ...prev,
        pricePesos: 'Ingresa un precio mayor a $0 en pesos.',
      }));
      return;
    }

    const priceCents = Math.round(parsedPricePesos * 100);
    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      setErrors((prev) => ({
        ...prev,
        stock: 'El stock debe ser un número entero mayor o igual a 0.',
      }));
      return;
    }

    const payload: CreateCatalogProductInput = {
      institutionId,
      name: name.trim(),
      category,
      priceCents,
      stock: parsedStock,
      isActive,
    };

    // Zod validation with shared contract
    const result = CreateCatalogProductSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const fieldName = err.path[0]?.toString() || 'general';
        fieldErrors[fieldName] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(payload, productToEdit?.id);
      onClose();
    } catch (err: unknown) {
      setErrors({
        general:
          err instanceof Error
            ? err.message
            : 'Error inesperado al guardar el producto.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const blockable = isParentBlockable(category);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Editar Producto del Catálogo' : 'Nuevo Producto para Kiosco'}
      description="Gestiona los artículos disponibles para los recreos. Todos los precios se expresan en pesos reales 1 a 1."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Product Name */}
        <Input
          label="Nombre del Producto"
          placeholder="Ej. Alfajor de Arroz y Miel, Barra de Cereal..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />

        {/* Category Select */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="product-category-select"
            className="text-sm font-semibold text-text-primary"
          >
            Categoría del Producto
          </label>
          <select
            id="product-category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors"
          >
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]} {isParentBlockable(cat) ? '— (Bloqueable por familias)' : ''}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-xs text-red-600 font-medium">{errors.category}</p>
          )}
        </div>

        {/* Parent Blockable Category Notice */}
        {blockable && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <ShieldAlert size={18} className="text-amber-800 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold block">
                Categoría con control parental activo
              </span>
              Los padres y tutores pueden bloquear la categoría <strong>Golosinas</strong> desde su app móvil. Si un alumno con bloqueo intenta comprar este producto en la caja POS, la transacción será denegada automáticamente.
            </div>
          </div>
        )}

        {/* Price in Pesos (Client conversion to cents) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Precio en Pesos ($ ARS)"
            type="number"
            step="1"
            min="1"
            placeholder="Ej. 1200"
            value={pricePesos}
            onChange={(e) => setPricePesos(e.target.value)}
            error={errors.pricePesos || errors.priceCents}
            helperText={
              pricePesos
                ? `Equivale a ${(parseFloat(pricePesos) || 0).toLocaleString('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                  })} (${Math.round((parseFloat(pricePesos) || 0) * 100)} centavos contables)`
                : 'Pesos argentinos 1 a 1'
            }
            required
          />

          {/* Stock */}
          <Input
            label="Stock Disponible"
            type="number"
            min="0"
            step="1"
            placeholder="Ej. 50"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            error={errors.stock}
            helperText="Unidades disponibles en el kiosco"
            required
          />
        </div>

        {/* Is Active Switch */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <input
            id="product-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-brand-primary rounded border-slate-300 focus:ring-brand-primary cursor-pointer"
          />
          <label
            htmlFor="product-active"
            className="text-xs font-semibold text-text-primary cursor-pointer select-none"
          >
            Producto activo y visible para cobro en el POS escolar
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {productToEdit ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
