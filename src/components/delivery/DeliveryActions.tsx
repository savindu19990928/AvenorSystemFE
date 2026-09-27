import React from 'react';
import { FileTextIcon, PackageCheckIcon, TruckIcon } from 'lucide-react';
import type { Delivery } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

interface DeliveryActionsProps {
  delivery: Delivery;
  onDispatch: (d: Delivery) => void;
  onDeliver: (d: Delivery) => void;
  onNote: (d: Delivery) => void;
}

export function DeliveryActions({ delivery, onDispatch, onDeliver, onNote }: DeliveryActionsProps) {
  const { hasRole } = useAuth();
  const canAct = hasRole('ADMIN', 'DELIVERY');
  const s = delivery.status;
  return (
    <div className="flex flex-wrap justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      {canAct && (s === 'READY' || s === 'DELIVERY_PENDING') &&
      <Button size="sm" variant="primary" icon={TruckIcon} onClick={() => onDispatch(delivery)}>Dispatch</Button>
      }
      {canAct && (s === 'DISPATCHED' || s === 'OUT_FOR_DELIVERY') &&
      <Button size="sm" variant="primary" icon={PackageCheckIcon} onClick={() => onDeliver(delivery)}>Mark delivered</Button>
      }
      <Button size="sm" variant="ghost" icon={FileTextIcon} onClick={() => onNote(delivery)}>Note</Button>
    </div>);

}