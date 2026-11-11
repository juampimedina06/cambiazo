'use client';

import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  PackageCheck,
  Star,
  Sparkles,
  Medal,
  Clock,
  Shield,
  Search,
} from 'lucide-react';
import {
  SchoolReward,
  LeaderboardEntry,
  RewardRedemption,
} from '@/shared/api/types';
import { apiClient } from '@/shared/api/api-client';
import { getActiveInstitutionId } from '@/shared/api/tenant';
import { SchoolRewardSchema } from '@cambiazo/shared';
import { Button } from '@/shared/ui/Button';
import { Pill } from '@/shared/ui/Pill';
import { Modal } from '@/shared/ui/Modal';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function SchoolRewardsPage() {
  const [activeTab, setActiveTab] = useState<'rewards' | 'leaderboard' | 'redemptions'>('rewards');
  const [rewards, setRewards] = useState<SchoolReward[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // New Reward Modal
  const [isNewRewardModalOpen, setIsNewRewardModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPointsCost, setNewPointsCost] = useState<number>(100);
  const [newStock, setNewStock] = useState<number>(20);
  const [newBadgeUrl, setNewBadgeUrl] = useState('');
  const [rewardFormError, setRewardFormError] = useState<string | null>(null);
  const [isSubmittingReward, setIsSubmittingReward] = useState(false);

  // Fulfillment in progress
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const activeId = getActiveInstitutionId();
      const [rewardsData, leaderboardData, redemptionsData] = await Promise.all([
        apiClient.getSchoolRewards(activeId),
        apiClient.getSchoolLeaderboard(activeId),
        apiClient.getRewardRedemptions(activeId),
      ]);
      setRewards(rewardsData);
      setLeaderboard(leaderboardData);
      setRedemptions(redemptionsData);
    } catch (err) {
      console.warn('Error loading rewards and leaderboard:', err);
      setApiError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar las recompensas desde la API.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Create Reward
  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReward(true);
    setRewardFormError(null);

    try {
      const payload: SchoolReward = {
        id: generateUuid(),
        institutionId: getActiveInstitutionId(),
        title: newTitle.trim(),
        description: newDescription.trim(),
        pointsCost: Number(newPointsCost),
        stock: newStock ? Number(newStock) : undefined,
        badgeImageUrl: newBadgeUrl.trim() || undefined,
        isActive: true,
      };

      // Validate with shared Zod schema
      SchoolRewardSchema.parse(payload);

      const created = await apiClient.createSchoolReward(payload);
      setRewards((prev) => [created, ...prev]);
      setIsNewRewardModalOpen(false);

      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewPointsCost(100);
      setNewStock(20);
      setNewBadgeUrl('');
    } catch (err: any) {
      console.error('Error creating reward:', err);
      setRewardFormError(err.message || 'Error al crear la recompensa escolar.');
    } finally {
      setIsSubmittingReward(false);
    }
  };

  // Toggle Reward Active Status
  const handleToggleActive = async (reward: SchoolReward) => {
    try {
      const updated = await apiClient.updateSchoolReward(reward.id, {
        isActive: !reward.isActive,
      });
      setRewards((prev) => prev.map((r) => (r.id === reward.id ? updated : r)));
    } catch (err) {
      console.error('Error toggling reward status:', err);
    }
  };

  // Delete Reward
  const handleDeleteReward = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta recompensa institucional?')) return;
    try {
      await apiClient.deleteSchoolReward(id);
      setRewards((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Error deleting reward:', err);
    }
  };

  // Fulfill Reward Redemption
  const handleFulfillRedemption = async (redemptionId: string) => {
    setFulfillingId(redemptionId);
    try {
      const updated = await apiClient.fulfillRewardRedemption(redemptionId);
      setRedemptions((prev) =>
        prev.map((r) => (r.id === redemptionId ? updated : r))
      );
    } catch (err) {
      console.error('Error fulfilling redemption:', err);
    } finally {
      setFulfillingId(null);
    }
  };

  const pendingRedemptionsCount = redemptions.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Recompensas, Insignias y Ranking Escolar
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Configuración de reconocimientos no monetarios, tablero de honor solidario y entregas de canjes escolares.
          </p>
        </div>

        {activeTab === 'rewards' && (
          <Button
            size="lg"
            variant="primary"
            onClick={() => setIsNewRewardModalOpen(true)}
            icon={<Plus size={20} />}
          >
            Nueva Recompensa
          </Button>
        )}
      </div>

      {/* Glass Pill Tabs */}
      <div className="inline-flex items-center gap-1 liquid-glass-subtle p-1 rounded-full self-start flex-wrap">
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'rewards'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Award size={16} />
          <span>Recompensas ({rewards.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Trophy size={16} />
          <span>Ranking Solidario</span>
        </button>

        <button
          onClick={() => setActiveTab('redemptions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'redemptions'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <PackageCheck size={16} />
          <span>Canjes en Preceptoría</span>
          {pendingRedemptionsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-400 text-amber-950">
              {pendingRedemptionsCount}
            </span>
          )}
        </button>
      </div>

      {apiError && (
        <div className="py-4 flex items-center gap-3">
          <span className="text-sm font-semibold text-red-600 dark:text-red-400">
            {apiError}
          </span>
          <Button size="sm" variant="outline" onClick={loadData}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Tab 1: Rewards Management ABM */}
      {activeTab === 'rewards' && (
        <section className="border-t border-slate-200/70 dark:border-white/[0.08]">
          <div className="py-3.5 border-b border-slate-200/60 dark:border-white/[0.07] flex justify-between items-center">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Catálogo de Premios ({rewards.length})
            </span>
            <span className="text-xs text-text-muted font-medium">
              Puntos solidarios
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-text-secondary text-sm">
              Cargando catálogo de recompensas...
            </div>
          ) : rewards.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
              <Award size={36} className="text-text-muted opacity-50" />
              <p className="font-semibold text-text-primary text-base">
                No hay recompensas configuradas
              </p>
              <p className="text-xs text-text-secondary max-w-sm">
                Crea reconocimientos para motivar a los alumnos a donar y compartir útiles.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/60 dark:divide-white/[0.07]">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="py-4 px-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-white/40 dark:hover:bg-white/[0.03] transition-colors"
                >
                  {/* Left: Thumbnail + Title + Stock */}
                  <div className="flex items-center gap-3.5 max-w-xl">
                    <div className="w-11 h-11 rounded-2xl bg-amber-400/15 dark:bg-amber-400/15 flex items-center justify-center text-amber-700 dark:text-amber-300 flex-shrink-0">
                      {reward.badgeImageUrl ? (
                        <Award size={20} />
                      ) : (
                        <Star size={20} className="fill-amber-400 text-amber-500" />
                      )}
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm sm:text-base text-text-primary leading-snug">
                          {reward.title}
                        </h3>
                        {reward.isActive ? (
                          <Pill label="Activo" variant="active" />
                        ) : (
                          <Pill label="Inactivo" variant="neutral" />
                        )}
                      </div>

                      <p className="text-xs text-text-secondary">
                        Stock: {reward.stock ?? 'Ilimitado'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Cost in yellow pencil points + Actions */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <Pill
                      variant="points"
                      icon={<Sparkles size={12} />}
                      label={`${reward.pointsCost} Pts`}
                    />

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={reward.isActive ? 'secondary' : 'primary'}
                        onClick={() => handleToggleActive(reward)}
                      >
                        {reward.isActive ? 'Pausar' : 'Activar'}
                      </Button>

                      <button
                        onClick={() => handleDeleteReward(reward.id)}
                        className="p-2 text-text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                        title="Eliminar recompensa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 2: School Leaderboard */}
      {activeTab === 'leaderboard' && (
        <section className="border-t border-slate-200/70 dark:border-white/[0.08]">
          <div className="py-3.5 border-b border-slate-200/60 dark:border-white/[0.07] flex justify-between items-center">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Cuadro de Honor
            </span>
            <span className="text-xs text-text-muted font-medium">
              Puntos solidarios acumulados
            </span>
          </div>

          <div className="divide-y divide-slate-200/60 dark:divide-white/[0.07]">
            {leaderboard.map((entry) => {
              const isTop3 = entry.rank <= 3;
              const medalColor =
                entry.rank === 1
                  ? 'text-yellow-500 fill-yellow-400'
                  : entry.rank === 2
                  ? 'text-slate-400 fill-slate-300'
                  : entry.rank === 3
                  ? 'text-amber-700 fill-amber-600'
                  : '';

              return (
                <div
                  key={entry.studentId}
                  className={`py-4 px-2 flex items-center justify-between gap-4 transition-colors ${
                    entry.rank === 1
                      ? 'bg-amber-400/10 dark:bg-amber-400/[0.08]'
                      : 'hover:bg-white/40 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Indicator */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-base tabular-nums flex-shrink-0">
                      {isTop3 ? (
                        <Medal size={26} className={medalColor} />
                      ) : (
                        <span className="text-text-secondary">#{entry.rank}</span>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span className="font-bold text-sm sm:text-base text-text-primary">
                        {entry.studentAlias}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {entry.badges.slice(0, 2).map((b) => (
                          <span
                            key={b}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-soft/80 dark:bg-brand-primary/20 text-brand-dark dark:text-purple-200"
                          >
                            {b.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Pill
                    variant="points"
                    icon={<Star size={13} className="text-amber-500 fill-amber-400" />}
                    label={`${entry.accumulatedPoints} Pts`}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tab 3: Pending Redemptions Fulfillment */}
      {activeTab === 'redemptions' && (
        <section className="border-t border-slate-200/70 dark:border-white/[0.08]">
          <div className="py-3.5 border-b border-slate-200/60 dark:border-white/[0.07] flex justify-between items-center">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Canjes ({redemptions.length})
            </span>
            <span className="text-xs text-text-muted font-medium">
              Preceptoría
            </span>
          </div>

          {redemptions.length === 0 ? (
            <div className="py-12 text-center text-text-secondary text-sm">
              No hay solicitudes de canje registradas.
            </div>
          ) : (
            <div className="divide-y divide-slate-200/60 dark:divide-white/[0.07]">
              {redemptions.map((red) => (
                <div
                  key={red.id}
                  className="py-4 px-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/40 dark:hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-brand-soft/80 dark:bg-brand-primary/20 text-brand-primary dark:text-purple-200 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      <Award size={18} />
                    </div>

                    <div className="flex flex-col">
                      <span className="font-bold text-sm sm:text-base text-text-primary">
                        {red.rewardTitle}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {red.studentName} ({red.studentGrade}) • {red.pointsCost} Pts
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {red.status === 'PENDING' ? (
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => handleFulfillRedemption(red.id)}
                        disabled={fulfillingId === red.id}
                        icon={<PackageCheck size={16} />}
                      >
                        Entregar
                      </Button>
                    ) : (
                      <Pill
                        variant="granted"
                        icon={<CheckCircle2 size={13} />}
                        label="Entregado"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Modal: Create School Reward */}
      <Modal
        isOpen={isNewRewardModalOpen}
        onClose={() => setIsNewRewardModalOpen(false)}
        title="Nueva Recompensa o Insignia Escolar"
      >
        <form onSubmit={handleCreateReward} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-primary">
              Título del Reconocimiento *
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              placeholder="Ej: Pase Libre de Biblioteca o Insignia Guardián del Reciclaje"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-2.5 bg-surface border border-slate-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-primary">
              Descripción / Requisitos *
            </label>
            <textarea
              required
              minLength={5}
              maxLength={500}
              rows={3}
              placeholder="Ej: Reconocimiento institucional otorgado por donar 3 o más libros escolares."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full p-2.5 bg-surface border border-slate-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-primary">
                Costo en Puntos Solidarios *
              </label>
              <input
                type="number"
                required
                min={1}
                value={newPointsCost}
                onChange={(e) => setNewPointsCost(Number(e.target.value))}
                className="w-full p-2.5 bg-surface border border-slate-200 rounded-xl text-sm text-text-primary tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-primary">
                Stock / Cupos Disponibles
              </label>
              <input
                type="number"
                min={0}
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
                className="w-full p-2.5 bg-surface border border-slate-200 rounded-xl text-sm text-text-primary tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-primary">
              URL del Ícono / Insignia Digital (Opcional)
            </label>
            <input
              type="url"
              placeholder="https://storage.cambiazo.ar/badges/insignia.png"
              value={newBadgeUrl}
              onChange={(e) => setNewBadgeUrl(e.target.value)}
              className="w-full p-2.5 bg-surface border border-slate-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {rewardFormError && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {rewardFormError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsNewRewardModalOpen(false)}
              disabled={isSubmittingReward}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmittingReward}
              icon={<Plus size={16} />}
            >
              Crear Recompensa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
