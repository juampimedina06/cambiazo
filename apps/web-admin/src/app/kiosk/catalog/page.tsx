'use client';

import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  LayoutGrid,
  List,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  CatalogProduct,
  CreateCatalogProductInput,
  ProductCategory,
  PRODUCT_CATEGORIES,
} from '@/shared/api/types';
import { apiClient } from '@/shared/api/api-client';
import { getActiveInstitutionId } from '@/shared/api/tenant';
import { Button } from '@/shared/ui/Button';
import {
  ProductRow,
  ProductGridCard,
  CATEGORY_LABELS,
  isParentBlockable,
} from '@/entities/catalog';
import { ProductModal } from '@/features/catalog-management';

export default function KioskCatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ProductCategory>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<CatalogProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [institutionId, setInstitutionId] = useState<string>(() => getActiveInstitutionId());

  const loadProducts = async (targetId: string = institutionId) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await apiClient.getCatalogProducts(
        targetId,
        selectedCategory === 'ALL' ? undefined : selectedCategory
      );
      setProducts(data);
    } catch (err) {
      console.error('Error loading catalog products:', err);
      setApiError(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar el catálogo desde la API.'
      );
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const activeId = getActiveInstitutionId();
    setInstitutionId(activeId);
    loadProducts(activeId);
  }, [selectedCategory]);

  const handleOpenCreateModal = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: CatalogProduct) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (
    data: CreateCatalogProductInput,
    productId?: string
  ) => {
    if (productId) {
      const updated = await apiClient.updateCatalogProduct(productId, data);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updated : p))
      );
    } else {
      const created = await apiClient.createCatalogProduct(data);
      setProducts((prev) => [created, ...prev]);
    }
  };

  const handleToggleStatus = async (product: CatalogProduct) => {
    try {
      const updated = await apiClient.updateCatalogProduct(product.id, {
        isActive: !product.isActive,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? updated : p))
      );
    } catch (err) {
      console.error('Error toggling product status:', err);
    }
  };

  const handleDeleteProduct = async (product: CatalogProduct) => {
    if (confirm(`¿Estás seguro de eliminar "${product.name}" del catálogo?`)) {
      try {
        await apiClient.deleteCatalogProduct(product.id);
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
      } catch (err) {
        console.error('Error deleting product:', err);
      }
    }
  };

  // Filtered in memory by search query
  const filteredProducts = products.filter((p) => {
    const categoryLabel = CATEGORY_LABELS[p.category as ProductCategory] || '';
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // KPI Metrics
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive).length;
  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const blockableCount = products.filter((p) => isParentBlockable(p.category)).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Catálogo de Productos del Kiosco
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Administra precios en pesos 1 a 1, stock escolar e indicadores de categorías con control parental.
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          icon={<Plus size={18} />}
          variant="primary"
          size="md"
        >
          Nuevo Producto
        </Button>
      </div>

      {/* Open Editorial Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-y border-slate-200/70 dark:border-white/[0.08] divide-y sm:divide-y-0 lg:divide-x divide-slate-200/70 dark:divide-white/[0.08]">
        <div className="py-4 lg:pr-5 flex items-center gap-3.5">
          <Package size={20} className="text-brand-primary dark:text-purple-300 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Total Catálogo
            </span>
            <div className="text-2xl font-extrabold text-text-primary tabular-nums mt-0.5">
              {totalProducts}{' '}
              <span className="text-xs text-text-secondary font-normal">artículos</span>
            </div>
          </div>
        </div>

        <div className="py-4 lg:px-5 flex items-center gap-3.5">
          <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              En Stock / Activos
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              {activeProducts}{' '}
              <span className="text-xs text-text-secondary font-normal">habilitados</span>
            </div>
          </div>
        </div>

        <div className="py-4 lg:px-5 flex items-center gap-3.5">
          <AlertTriangle size={20} className="text-amber-600 dark:text-amber-300 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Stock Bajo (≤ 5)
            </span>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-300 tabular-nums mt-0.5">
              {lowStockCount}{' '}
              <span className="text-xs text-text-secondary font-normal">a reponer</span>
            </div>
          </div>
        </div>

        <div className="py-4 lg:pl-5 flex items-center gap-3.5">
          <ShieldAlert size={20} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Bloqueables Familias
            </span>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
              {blockableCount}{' '}
              <span className="text-xs text-text-secondary font-normal">golosinas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Buscar producto o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 liquid-glass-subtle rounded-2xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60 transition-all"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 liquid-glass-subtle rounded-full p-1 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Vista de Lista plana"
            >
              <List size={15} />
              <span>Lista</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Vista de Grilla"
            >
              <LayoutGrid size={15} />
              <span>Grilla</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
              selectedCategory === 'ALL'
                ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                : 'liquid-glass-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            Todas las Categorías
          </button>
          {PRODUCT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                  : 'liquid-glass-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>{CATEGORY_LABELS[cat]}</span>
              {isParentBlockable(cat) && (
                <span
                  title="Bloqueable por familias"
                  className="w-2 h-2 rounded-full bg-amber-500 inline-block"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Products Content */}
      {apiError ? (
        <div className="py-10 text-center flex flex-col items-center gap-3 border-t border-slate-200/70 dark:border-white/[0.08]">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            {apiError}
          </p>
          <Button size="sm" variant="outline" onClick={() => loadProducts(institutionId)}>
            Reintentar
          </Button>
        </div>
      ) : isLoading ? (
        <div className="py-12 text-center text-text-secondary border-t border-slate-200/70 dark:border-white/[0.08]">
          <div className="inline-block w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Cargando catálogo del kiosco escolar...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-12 text-center text-text-secondary border-t border-slate-200/70 dark:border-white/[0.08]">
          <Package size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="font-bold text-text-primary text-base">
            No se encontraron productos
          </h3>
          <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No hay artículos que coincidan con "${searchQuery}".`
              : 'Aún no hay productos registrados en esta categoría.'}
          </p>
          <div className="mt-4">
            <Button size="sm" variant="outline" onClick={handleOpenCreateModal}>
              Agregar Primer Producto
            </Button>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        /* Open List directly on canvas */
        <section className="border-t border-slate-200/70 dark:border-white/[0.08]">
          <div className="py-3.5 border-b border-slate-200/60 dark:border-white/[0.07] flex items-center justify-between text-xs font-bold text-text-secondary uppercase tracking-wider">
            <span>Artículo</span>
            <div className="flex items-center gap-12">
              <span className="hidden sm:inline">Categoría</span>
              <span>Precio</span>
            </div>
          </div>

          <div className="divide-y divide-slate-200/60 dark:divide-white/[0.07]">
            {filteredProducts.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                onEdit={handleOpenEditModal}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
        </section>
      ) : (
        /* Grid Mode on Base Canvas (NOT nested in another Surface) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductGridCard
              key={product.id}
              product={product}
              onEdit={handleOpenEditModal}
            />
          ))}
        </div>
      )}

      {/* Product Create/Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveProduct}
        productToEdit={productToEdit}
        institutionId={institutionId}
      />
    </div>
  );
}
