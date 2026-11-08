'use client';

import React, { useEffect, useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Building2,
  History,
} from 'lucide-react';
import {
  KioskWithdrawal,
  KioskLedgerBalance,
  KioskWithdrawalRequestInput,
} from '@/shared/api/types';
import { apiClient } from '@/shared/api/api-client';
import { DEFAULT_KIOSK_INSTITUTION_ID } from '@/shared/api/mock-adapter';
import { Surface } from '@/shared/ui/Surface';
import { Button } from '@/shared/ui/Button';
import { LedgerBalanceCard, WithdrawalRow } from '@/entities/withdrawal';
import { WithdrawalModal } from '@/features/withdrawal-request';

export default function KioskWithdrawalsPage() {
  const [balance, setBalance] = useState<KioskLedgerBalance>({
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    totalSalesCents: 0,
    totalWithdrawnCents: 0,
    availableBalanceCents: 0,
    currency: 'ARS',
    lastMovementAt: new Date().toISOString(),
  });
  const [withdrawals, setWithdrawals] = useState<KioskWithdrawal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [balanceData, withdrawalsData] = await Promise.all([
        apiClient.getKioskLedgerBalance(DEFAULT_KIOSK_INSTITUTION_ID),
        apiClient.getKioskWithdrawals(DEFAULT_KIOSK_INSTITUTION_ID),
      ]);
      setBalance(balanceData);
      setWithdrawals(withdrawalsData);
    } catch (err) {
      console.error('Error loading withdrawals and balance:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestWithdrawal = async (data: KioskWithdrawalRequestInput) => {
    const created = await apiClient.requestKioskWithdrawal(
      data,
      DEFAULT_KIOSK_INSTITUTION_ID
    );
    setWithdrawals((prev) => [created, ...prev]);

    // Refresh balance from double-entry ledger
    const updatedBalance = await apiClient.getKioskLedgerBalance(
      DEFAULT_KIOSK_INSTITUTION_ID
    );
    setBalance(updatedBalance);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Retiros a Mercado Pago
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Liquidación 100% neta de ventas del kiosco directamente a tu cuenta bancaria o CVU/Alias.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={loadData}
          isLoading={isRefreshing}
          icon={<RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />}
        >
          Actualizar Saldo
        </Button>
      </div>

      {/* Highlighted Balance Card */}
      <LedgerBalanceCard
        balance={balance}
        onRequestWithdrawal={() => setIsModalOpen(true)}
        isLoading={isLoading}
      />

      {/* Withdrawal History List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={18} className="text-text-secondary" />
            <h2 className="font-extrabold text-lg text-text-primary">
              Historial de Retiros y Transferencias
            </h2>
          </div>
          <span className="text-xs text-text-secondary font-medium">
            {withdrawals.length} transferencias registradas
          </span>
        </div>

        {isLoading ? (
          <Surface className="p-12 text-center text-text-secondary">
            <div className="inline-block w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Cargando historial de retiros...</p>
          </Surface>
        ) : withdrawals.length === 0 ? (
          <Surface className="p-12 text-center text-text-secondary">
            <Wallet size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="font-bold text-text-primary text-base">
              Aún no has solicitado retiros
            </h3>
            <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
              Cuando solicites una transferencia a tu CVU o Alias de Mercado Pago, quedará registrada aquí con su comprobante de auditoría.
            </p>
          </Surface>
        ) : (
          <Surface>
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-text-secondary uppercase tracking-wider">
              <span>Fecha / Auditoría</span>
              <span className="hidden sm:inline">Destino Mercado Pago</span>
              <span>Monto Transferido</span>
            </div>

            <div className="divide-y divide-slate-100">
              {withdrawals.map((withdrawal) => (
                <WithdrawalRow key={withdrawal.id} withdrawal={withdrawal} />
              ))}
            </div>
          </Surface>
        )}
      </div>

      {/* Withdrawal Request Modal */}
      <WithdrawalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleRequestWithdrawal}
        balance={balance}
      />
    </div>
  );
}
