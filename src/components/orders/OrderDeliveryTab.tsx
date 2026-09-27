import React, { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import type { Delivery, OrderDetail } from '../../types/api';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatDateTime } from '../../utils/format';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { StateMessage } from '../ui/StateMessage';
import { DeliveryActions } from '../delivery/DeliveryActions';
import { CreateDeliveryModal } from '../workflow/CreateDeliveryModal';
import { DispatchModal } from '../workflow/DispatchModal';
import { DeliverModal } from '../workflow/DeliverModal';
import { DeliveryNoteModal } from '../workflow/DeliveryNoteModal';

export function OrderDeliveryTab({ order, onChanged }: {order: OrderDetail;onChanged: () => void;}) {
  const { hasRole } = useAuth();
  const [creating, setCreating] = useState(false);
  const [dispatching, setDispatching] = useState<Delivery | null>(null);
  const [delivering, setDelivering] = useState<Delivery | null>(null);
  const [noteId, setNoteId] = useState<number | null>(null);
  const list = useApi(
    () => api.list<Delivery>('/api/delivery/deliveries/', { order: order.id }).then((l) => l.filter((d) => d.order === order.id || d.order_code === order.order_id)),
    [order.id]
  );
  const refresh = () => {
    list.reload();
    onChanged();
  };

  return (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Deliver to: <span className="text-ink">{order.delivery_address || '—'}</span> · due {formatDate(order.expected_delivery_date)}</p>
        {hasRole('ADMIN', 'DELIVERY') && <Button size="sm" icon={PlusIcon} onClick={() => setCreating(true)}>Create delivery</Button>}
      </div>
      {list.loading && !list.data ?
      <StateMessage kind="loading" /> :
      list.error ?
      <StateMessage kind="error" message={list.error} onRetry={list.reload} /> :
      !list.data?.length ?
      <StateMessage kind="empty" title="No delivery yet" message="A delivery is created once the order is packed and ready." /> :

      <ul className="divide-y divide-line rounded-lg border border-line">
          {list.data.map((d) =>
        <li key={d.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium">{d.delivery_number}</span>
                  <StatusBadge status={d.status} label={d.status_display} />
                </div>
                <p className="mt-1 text-muted">
                  {d.courier_name ? `${d.courier_name}${d.tracking_number ? ` · ${d.tracking_number}` : ''}` : 'Courier not assigned'}
                </p>
                <p className="mt-0.5 text-xs text-faint">
                  {d.actual_delivery_date ? `Delivered ${formatDateTime(d.actual_delivery_date)} to ${d.recipient_name}` : d.dispatched_date ? `Dispatched ${formatDateTime(d.dispatched_date)} · ETA ${formatDate(d.estimated_delivery_date)}` : ''}
                </p>
              </div>
              <DeliveryActions delivery={d} onDispatch={setDispatching} onDeliver={setDelivering} onNote={(x) => setNoteId(x.id)} />
            </li>
        )}
        </ul>
      }
      <CreateDeliveryModal open={creating} order={order} onClose={() => setCreating(false)} onDone={() => {setCreating(false);refresh();}} />
      <DispatchModal delivery={dispatching} onClose={() => setDispatching(null)} onDone={() => {setDispatching(null);refresh();}} />
      <DeliverModal delivery={delivering} onClose={() => setDelivering(null)} onDone={() => {setDelivering(null);refresh();}} />
      <DeliveryNoteModal deliveryId={noteId} onClose={() => setNoteId(null)} />
    </div>);

}