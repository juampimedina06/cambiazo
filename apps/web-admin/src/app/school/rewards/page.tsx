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
import { DEFAULT_KIOSK_INSTITUTION_ID } from '@/shared/api/mock-adapter';
import { SchoolRewardSchema } from '@cambiazo/shared';
import { Surface } from '@/shared/ui/Surface';
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
    try {
      const [rewardsData, leaderboardData, redemptionsData] = await Promise.all([
        apiClient.getSchoolRewards(),
        apiClient.getSchoolLeaderboard(),
        apiClient.getRewardRedemptions(),
      ]);
      setRewards(rewardsData);
      setLeaderboard(leaderboardData);
      setRedemptions(redemptionsData);
    } catch (err) {
      console.error('Error loading rewards and leaderboard:', err);
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
        institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
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

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'rewards'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Award size={18} />
          <span>Recompensas e Insignias ({rewards.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'leaderboard'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Trophy size={18} />
          <span>Ranking Escolar Solidario</span>
        </button>

        <button
          onClick={() => setActiveTab('redemptions')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'redemptions'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <PackageCheck size={18} />
          <span>Canjes en Preceptoría</span>
          {pendingRedemptionsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-400 text-amber-950">
              {pendingRedemptionsCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Rewards Management ABM */}
      {activeTab === 'rewards' && (
        <Surface>
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Catálogo de Premios e Insignias Escolares ({rewards.length})
            </span>
            <span className="text-xs text-text-secondary font-medium">
              Economía solidaria (puntos amarillos sin valor monetario)
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-text-secondary text-sm">
              Cargando catálogo de recompensas...
            </div>
          ) : rewards.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
              <Award size={36} className="text-slate-300" />
              <p className="font-semibold text-text-primary text-base">
                No hay recompensas configuradas
              </p>
              <p className="text-xs text-text-secondary max-w-sm">
                Crea reconocimientos para motivar a los alumnos a donar y compartir útiles.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  {/* Left: Thumbnail + Title + Description */}
                  <div className="flex items-start gap-4 max-w-xl">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 flex-shrink-0">
                      {reward.badgeImageUrl ? (
                        <Award size={24} className="text-amber-600" />
                      ) : (
                        <Star size={24} className="text-amber-500 fill-amber-400" />
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-text-primary leading-snug">
                          {reward.title}
                        </h3>
                        {reward.isActive ? (
                          <Pill label="Activo" variant="active" />
                        ) : (
                          <Pill label="Inactivo" variant="neutral" />
                        )}
                      </div>

                      <p className="text-xs text-text-secondary">
                        {reward.description}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                        <span>Stock restante: <strong>{reward.stock ?? 'Ilimitado'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Cost in yellow pencil points + Actions */}
                  <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    <div className="px-3.5 py-1.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 font-extrabold text-sm flex items-center gap-1.5 tabular-nums">
                      <Sparkles size={14} className="text-amber-600" />
                      <span>{reward.pointsCost} Pts</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={reward.isActive ? 'secondary' : 'primary'}
                        onClick={() => handleToggleActive(reward)}
                      >
                        {reward.isActive ? 'Pausar' : 'Activar'}
                      </Button>

                      <button
                        onClick={() => handleDeleteReward(reward.id)}
                        className="p-2 text-text-secondary hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
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
        </Surface>
      )}

      {/* Tab 2: School Leaderboard */}
      {activeTab === 'leaderboard' && (
        <Surface>
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Cuadro de Honor y Puntos Solidarios
            </span>
            <span className="text-xs text-text-secondary font-medium">
              Alumnos con mayor impacto en la reutilización de útiles
            </span>
          </div>

          <div className="divide-y divide-slate-100">
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
                  className={`p-5 flex items-center justify-between gap-4 transition-colors ${
                    entry.rank === 1 ? 'bg-amber-50/40' : 'hover:bg-slate-50/60'
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
                      <span className="font-bold text-base text-text-primary">
                        {entry.studentAlias}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {entry.badges.map((b) => (
                          <span
                            key={b}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-brand-dark"
                          >
                            {b.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-4 py-2 rounded-2xl bg-amber-100 border border-amber-300 text-amber-950 font-extrabold text-base flex items-center gap-1.5 tabular-nums">
                      <Star size={16} className="text-amber-500 fill-amber-400" />
                      <span>{entry.accumulatedPoints} Pts</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Surface>
      )}

      {/* Tab 3: Pending Redemptions Fulfillment */}
      {activeTab === 'redemptions' && (
        <Surface>
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Solicitudes de Canje en el Punto de Entrega ({redemptions.length})
            </span>
            <span className="text-xs text-text-secondary font-medium">
              Entrega de diplomas, pases o insignias al alumno
            </span>
          </div>

          {redemptions.length === 0 ? (
            <div className="p-12 text-center text-text-secondary text-sm">
              No hay solicitudes de canje registradas.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {redemptions.map((red) => (
                <div
                  key={red.id}
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-brand-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                      <Award size={20} />
                    </div>

                    <div className="flex flex-col">
                      <span className="font-bold text-base text-text-primary">
                        {red.rewardTitle}
                      </span>
                      <span className="text-xs text-text-secondary">
                        Alumno: <strong className="text-text-primary">{red.studentName}</strong> ({red.studentGrade}) • Canjeado por {red.pointsCost} Pts
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
                        Confirmar Entrega Física
                      </Button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <CheckCircle2 size={14} />
                        Entregado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Surface>
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
