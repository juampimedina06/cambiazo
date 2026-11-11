'use client';

import React, { useEffect, useState } from 'react';
import {
  PackageCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Sparkles,
  ArrowRight,
  BookOpen,
  Filter,
  Check,
} from 'lucide-react';
import {
  ExchangeItem,
  ExchangeMode,
  ModerationStatus,
  ModerateExchangeItemDto,
} from '@/shared/api/types';
import { apiClient } from '@/shared/api/api-client';
import { getActiveInstitutionId } from '@/shared/api/tenant';
import { ModerateExchangeItemSchema } from '@cambiazo/shared';
import { Button } from '@/shared/ui/Button';
import { Pill } from '@/shared/ui/Pill';
import { Modal } from '@/shared/ui/Modal';

export default function SchoolModerationPage() {
  const [items, setItems] = useState<ExchangeItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | ModerationStatus>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | ExchangeMode>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Reject Modal State
  const [rejectingItem, setRejectingItem] = useState<ExchangeItem | null>(null);
  const [educationalReason, setEducationalReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Deliver Modal State
  const [deliveringItem, setDeliveringItem] = useState<ExchangeItem | null>(null);
  const [awardedPointsInput, setAwardedPointsInput] = useState<number>(50);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  const loadItems = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await apiClient.getExchangeItems(getActiveInstitutionId());
      setItems(data);
    } catch (err) {
      console.warn('Error loading exchange items:', err);
      setApiError(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar la bandeja de moderación.'
      );
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Quick Action: Approve Publication
  const handleApprove = async (item: ExchangeItem) => {
    setActionInProgressId(item.id);
    try {
      const payload: ModerateExchangeItemDto = {
        itemId: item.id,
        status: 'APPROVED',
        moderatorNotes: 'Publicación revisada y aprobada para intercambio escolar.',
        awardedPoints: 0,
      };

      // Validate with shared Zod schema
      ModerateExchangeItemSchema.parse(payload);

      const updated = await apiClient.moderateExchangeItem(payload);
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err: any) {
      console.error('Error approving item:', err);
      alert(err.message || 'Error al aprobar la publicación');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Quick Action: Submit Rejection with Educational Reason
  const handleSubmitReject = async () => {
    if (!rejectingItem) return;
    if (!educationalReason.trim()) {
      setRejectError('El motivo pedagógico o educativo es obligatorio para enviar feedback al alumno.');
      return;
    }

    setActionInProgressId(rejectingItem.id);
    setRejectError(null);

    try {
      const payload: ModerateExchangeItemDto = {
        itemId: rejectingItem.id,
        status: 'REJECTED',
        moderatorNotes: educationalReason.trim(),
        awardedPoints: 0,
      };

      ModerateExchangeItemSchema.parse(payload);

      const updated = await apiClient.moderateExchangeItem(payload);
      setItems((prev) => prev.map((i) => (i.id === rejectingItem.id ? updated : i)));
      setRejectingItem(null);
      setEducationalReason('');
    } catch (err: any) {
      console.error('Error rejecting item:', err);
      setRejectError(err.message || 'Error al rechazar publicación');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Quick Action: Confirm Physical Delivery at Pickup Point
  const handleSubmitDelivery = async () => {
    if (!deliveringItem) return;
    if (awardedPointsInput < 0) {
      setDeliveryError('Los puntos otorgados deben ser un número no negativo.');
      return;
    }

    setActionInProgressId(deliveringItem.id);
    setDeliveryError(null);

    try {
      const payload: ModerateExchangeItemDto = {
        itemId: deliveringItem.id,
        status: 'DELIVERED',
        moderatorNotes: deliveryNotes.trim() || 'Entregado en el Punto de Entrega Escolar (Preceptoría).',
        awardedPoints: Number(awardedPointsInput),
      };

      ModerateExchangeItemSchema.parse(payload);

      const updated = await apiClient.moderateExchangeItem(payload);
      setItems((prev) => prev.map((i) => (i.id === deliveringItem.id ? updated : i)));
      setDeliveringItem(null);
      setDeliveryNotes('');
    } catch (err: any) {
      console.error('Error confirming delivery:', err);
      setDeliveryError(err.message || 'Error al confirmar la entrega');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesMode = modeFilter === 'ALL' || item.mode === modeFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesMode && matchesSearch;
  });

  // Aggregate Metrics
  const pendingCount = items.filter((i) => i.status === 'PENDING').length;
  const approvedCount = items.filter((i) => i.status === 'APPROVED').length;
  const deliveredCount = items.filter((i) => i.status === 'DELIVERED').length;
  const rejectedCount = items.filter((i) => i.status === 'REJECTED').length;

  const modeBadge = (mode: ExchangeMode) => {
    switch (mode) {
      case 'DONATION':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Donación
          </span>
        );
      case 'BARTER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-soft text-brand-dark border border-purple-200">
            Intercambio
          </span>
        );
      case 'LOAN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            Préstamo
          </span>
        );
    }
  };

  const statusPill = (status: ModerationStatus) => {
    switch (status) {
      case 'PENDING':
        return <Pill label="Pendiente de Revisión" variant="pending" />;
      case 'APPROVED':
        return <Pill label="Publicado / Disponible" variant="active" />;
      case 'DELIVERED':
        return <Pill label="Entregado en Escuela" variant="granted" />;
      case 'REJECTED':
        return <Pill label="Rechazado" variant="suspended" />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title & Desk Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Moderación y Punto de Entrega Escolar
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Supervisión pedagógica de publicaciones de útiles, recepción física en preceptoría y acreditación de Puntos de Comunidad.
          </p>
        </div>
      </div>

      {/* Open Editorial Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-y border-slate-200/70 dark:border-white/[0.08] divide-y sm:divide-y-0 sm:divide-x divide-slate-200/70 dark:divide-white/[0.08]">
        <div className="py-4 sm:pr-5 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-600 dark:text-amber-300 flex-shrink-0" />
          <div>
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
              Pendientes
            </span>
            <span className="text-xl font-extrabold text-text-primary tabular-nums">
              {pendingCount}
            </span>
          </div>
        </div>

        <div className="py-4 sm:px-5 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-brand-primary dark:text-purple-300 flex-shrink-0" />
          <div>
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
              Disponibles
            </span>
            <span className="text-xl font-extrabold text-text-primary tabular-nums">
              {approvedCount}
            </span>
          </div>
        </div>

        <div className="py-4 sm:px-5 flex items-center gap-3">
          <PackageCheck size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div>
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
              Entregados
            </span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {deliveredCount}
            </span>
          </div>
        </div>

        <div className="py-4 sm:pl-5 flex items-center gap-3">
          <XCircle size={18} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <div>
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
              Rechazados
            </span>
            <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
              {rejectedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Buscar por útil o alumno..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 liquid-glass-subtle rounded-2xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 liquid-glass-subtle p-1 rounded-full">
            {(['ALL', 'PENDING', 'APPROVED', 'DELIVERED', 'REJECTED'] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    statusFilter === status
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {status === 'ALL'
                    ? 'Todos'
                    : status === 'PENDING'
                    ? 'Pendientes'
                    : status === 'APPROVED'
                    ? 'Aprobados'
                    : status === 'DELIVERED'
                    ? 'Entregados'
                    : 'Rechazados'}
                </button>
              )
            )}
          </div>

          {/* Mode Filter Buttons */}
          <div className="flex items-center gap-1 liquid-glass-subtle p-1 rounded-full">
            {(['ALL', 'BARTER', 'DONATION', 'LOAN'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setModeFilter(mode)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  modeFilter === mode
                    ? 'bg-amber-400 text-amber-950 shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {mode === 'ALL'
                  ? 'Todas'
                  : mode === 'BARTER'
                  ? 'Intercambio'
                  : mode === 'DONATION'
                  ? 'Donación'
                  : 'Préstamo'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Open List directly on canvas */}
      <section className="border-t border-slate-200/70 dark:border-white/[0.08]">
        <div className="py-3.5 border-b border-slate-200/60 dark:border-white/[0.07] flex justify-between items-center">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Publicaciones ({filteredItems.length})
          </span>
          <span className="text-xs text-text-muted font-medium">
            Preceptoría Central
          </span>
        </div>

        {apiError ? (
          <div className="py-10 text-center flex flex-col items-center gap-3">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {apiError}
            </p>
            <Button size="sm" variant="outline" onClick={loadItems}>
              Reintentar
            </Button>
          </div>
        ) : isLoading ? (
          <div className="py-12 text-center text-text-secondary text-sm">
            Cargando bandeja de moderación escolar...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
            <BookOpen size={36} className="text-text-muted opacity-50" />
            <p className="font-semibold text-text-primary text-base">
              No hay publicaciones que coincidan
            </p>
            <p className="text-xs text-text-secondary max-w-sm">
              Prueba cambiando los filtros de estado o modalidad escolar.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/60 dark:divide-white/[0.07]">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="py-4 px-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-white/40 dark:hover:bg-white/[0.03] transition-colors"
              >
                {/* 1. Item Identity & Student */}
                <div className="flex items-start gap-3.5 max-w-xl">
                  <div className="w-12 h-12 rounded-2xl bg-brand-soft/80 dark:bg-brand-primary/20 flex-shrink-0 flex items-center justify-center text-brand-primary dark:text-purple-200 overflow-hidden">
                    {item.photoUrls?.[0] ? (
                      <img
                        src={item.photoUrls[0]}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen size={20} />
                    )}
                  </div>

                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-text-primary leading-snug">
                        {item.title}
                      </h3>
                      {modeBadge(item.mode)}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
                      <span className="font-semibold text-text-primary">
                        {item.studentName}
                      </span>
                      <span>•</span>
                      <span>{item.studentGrade}</span>
                      {item.awardedPoints > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 dark:text-amber-300 font-bold flex items-center gap-1">
                            <Sparkles size={12} />
                            +{item.awardedPoints} Pts
                          </span>
                        </>
                      )}
                    </div>

                    {item.moderatorNotes && (
                      <p className="mt-1 border-l-2 border-brand-primary/50 pl-2.5 text-xs text-text-secondary">
                        {item.moderatorNotes}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Status & Quick Actions */}
                <div className="flex flex-col sm:flex-row items-end md:items-center gap-3 w-full md:w-auto justify-end">
                  {statusPill(item.status)}

                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    {item.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleApprove(item)}
                          disabled={actionInProgressId === item.id}
                          icon={<Check size={14} />}
                        >
                          Aprobar
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            setRejectingItem(item);
                            setEducationalReason('');
                            setRejectError(null);
                          }}
                          disabled={actionInProgressId === item.id}
                          icon={<XCircle size={14} />}
                        >
                          Rechazar
                        </Button>
                      </>
                    )}

                    {item.status === 'APPROVED' && (
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => {
                          setDeliveringItem(item);
                          setAwardedPointsInput(50);
                          setDeliveryNotes('');
                          setDeliveryError(null);
                        }}
                        disabled={actionInProgressId === item.id}
                        icon={<PackageCheck size={16} />}
                      >
                        Confirmar Entrega
                      </Button>
                    )}

                    {item.status === 'DELIVERED' && (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <CheckCircle2 size={14} />
                        Entrega Finalizada
                      </span>
                    )}

                    {item.status === 'REJECTED' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleApprove(item)}
                        disabled={actionInProgressId === item.id}
                      >
                        Reconsiderar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal: Rejection with Mandatory Educational Feedback Reason */}
      <Modal
        isOpen={Boolean(rejectingItem)}
        onClose={() => setRejectingItem(null)}
        title="Rechazar Publicación con Motivo Educativo"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            En CAMBIAZO cada rechazo es formativo. Escribe una devolución pedagógica explicando al alumno{' '}
            <strong className="text-text-primary">{rejectingItem?.studentName}</strong> qué debe corregir (ej. estado de conservación, higiene o descripción).
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-primary">
              Motivo Pedagógico / Devolución Escolar *
            </label>
            <textarea
              rows={4}
              value={educationalReason}
              onChange={(e) => setEducationalReason(e.target.value)}
              placeholder="Ej: El libro de texto tiene hojas rotas o escritas con tinta indeleble. Sugerimos borrar anotaciones en lápiz y verificar que el lomo esté íntegro."
              className="w-full p-3 bg-surface border border-slate-200 rounded-xl text-sm text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {rejectError && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {rejectError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => setRejectingItem(null)}
              disabled={actionInProgressId === rejectingItem?.id}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleSubmitReject}
              disabled={actionInProgressId === rejectingItem?.id}
              icon={<XCircle size={16} />}
            >
              Confirmar Rechazo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirm Physical Delivery & Award Community Points */}
      <Modal
        isOpen={Boolean(deliveringItem)}
        onClose={() => setDeliveringItem(null)}
        title="Confirmar Entrega en Punto Escolar"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            Registra que el útil <strong className="text-text-primary">{deliveringItem?.title}</strong> fue recibido físicamente en la preceptoría escolar. Esto acreditará Puntos de Comunidad al alumno donante/intercambiador.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-primary">
              Puntos de Comunidad a Acreditar (Solidarios) *
            </label>
            <input
              type="number"
              min={0}
              max={500}
              value={awardedPointsInput}
              onChange={(e) => setAwardedPointsInput(Number(e.target.value))}
              className="w-full p-3 bg-surface border border-slate-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary tabular-nums"
            />
            <span className="text-[11px] text-text-secondary">
              Puntos estándar recomendados: 50 Pts por útiles medianos, 100 Pts por manuales escolares completos.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-primary">
              Observaciones de Recepción en Preceptoría (Opcional)
            </label>
            <input
              type="text"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Ej: Recibido en preceptoría turno mañana por Prof. Gómez"
              className="w-full p-3 bg-surface border border-slate-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {deliveryError && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {deliveryError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => setDeliveringItem(null)}
              disabled={actionInProgressId === deliveringItem?.id}
            >
              Cancelar
            </Button>
            <Button
              variant="accent"
              onClick={handleSubmitDelivery}
              disabled={actionInProgressId === deliveringItem?.id}
              icon={<PackageCheck size={16} />}
            >
              Confirmar Entrega y Acreditar Puntos
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
