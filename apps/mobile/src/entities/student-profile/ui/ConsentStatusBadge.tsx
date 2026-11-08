import React from 'react';
import { type ConsentStatus } from '@cambiazo/shared';
import { Pill, PillVariant } from '../../../shared/ui/Pill.js';

export interface ConsentStatusBadgeProps {
  status: ConsentStatus;
  testID?: string;
}

export const ConsentStatusBadge: React.FC<ConsentStatusBadgeProps> = ({
  status,
  testID = 'consent-status-badge',
}) => {
  const config: Record<ConsentStatus, { label: string; variant: PillVariant; icon: string }> = {
    GRANTED: {
      label: 'Consentimiento Activo',
      variant: 'mint',
      icon: '✅',
    },
    PENDING: {
      label: 'Firma Pendiente',
      variant: 'warning',
      icon: '⏳',
    },
    REVOKED: {
      label: 'Consentimiento Revocado',
      variant: 'danger',
      icon: '🛑',
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
