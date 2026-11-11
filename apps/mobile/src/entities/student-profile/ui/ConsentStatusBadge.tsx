import React from 'react';
import { ShieldCheck, Clock, ShieldAlert } from 'lucide-react-native';
import { type ConsentStatus } from '@cambiazo/shared';
import { Pill, PillVariant } from '../../../shared/ui/Pill';
import { colors } from '../../../shared/theme/colors';

export interface ConsentStatusBadgeProps {
  status: ConsentStatus;
  testID?: string;
}

export const ConsentStatusBadge: React.FC<ConsentStatusBadgeProps> = ({
  status,
  testID = 'consent-status-badge',
}) => {
  const config: Record<ConsentStatus, { label: string; variant: PillVariant; icon: React.ReactNode }> = {
    GRANTED: {
      label: 'Consentimiento Activo',
      variant: 'mint',
      icon: <ShieldCheck size={13} color={colors.economy.moneyMintDark} />,
    },
    PENDING: {
      label: 'Firma Pendiente',
      variant: 'warning',
      icon: <Clock size={13} color="#C2410C" />,
    },
    REVOKED: {
      label: 'Consentimiento Revocado',
      variant: 'danger',
      icon: <ShieldAlert size={13} color={colors.status.danger} />,
    },
  };

  const item = config[status];

  return (
    <Pill
      label={item.label}
      icon={item.icon}
      variant={item.variant}
      testID={testID}
    />
  );
};
