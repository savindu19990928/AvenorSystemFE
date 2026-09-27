import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBrands } from '../../contexts/BrandContext';
import { useApi } from '../../hooks/useApi';
import { api } from '../../utils/api';
import type { Delivery } from '../../types/api';
import { formatDate, humanize } from '../../utils/format';
import { DELIVERY_STATUSES } from '../../data/workflow';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BrandTag } from '../../components/ui/BrandTag';
import { Tabs } from '../../components/ui/Tabs';
import { DeliveryActions } from '../../components/delivery/DeliveryActions';
import { CreateDeliveryModal } from '../../components/workflow/CreateDeliveryModal';
import { DispatchModal } from '../../components/workflow/DispatchModal';
import { DeliverModal } from '../../components/workflow/DeliverModal';
import { DeliveryNoteModal } from '../../components/workflow/DeliveryNoteModal';

export function DeliveriesPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { scopedBrand } = useBrands();
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [dispatching, setDispatching] = useState<Delivery | null>(null);
  const [delivering, setDelivering] = useState<Delivery | null>(null);
  const [noteId, setNoteId] = useState<number | null>(null);
  const { data, loading, error, reload } = useApi(() => api.list<Delivery>('/api/delivery/deliveries/', { status }), [status]);
  const rows = data?.filter((d) => !scopedBrand || d.brand_name === scopedBrand.name) ?? null;

  return (
    <div>
      <PageHeader
        title="Delivery"
        description="Ready → Delivery pending → Dispatched → Out for delivery → Delivered. Delivery notes carry the correct brand and order."
        actions={hasRole('ADMIN', 'DELIVERY') && <Button variant="primary" icon={PlusIcon} onClick={() => setCreating(true)}>Create delivery</Button>} />
      
      <Panel flush>
        <div className="px-4 pt-1">
          <Tabs tabs={[{ id: '', label: 'All' }, ...DELIVERY_STATUSES.map((s) => ({ id: s, label: humanize(s) }))]} active={status} onChange={setStatus} />
        </div>
        <DataTable
          rows={rows}
          loading={loading}
          error={error}
          onRetry={reload}
          getRowKey={(d) => d.id}
          onRowClick={(d) => navigate(`/orders/${d.order}`)}
          emptyTitle="No deliveries"
          columns={[
          { key: 'no', header: 'Delivery', render: (d) => <span className="font-mono text-xs font-medium">{d.delivery_number}</span> },
          { key: 'order', header: 'Order', render: (d) => <span className="font-mono text-xs">{d.order_code}</span> },
          {
            key: 'cust',
            header: 'Customer / address',
            render: (d) =>
            <div className="max-w-xs">
                  <p className="font-medium">{d.customer_name}</p>
                  <p className="truncate text-xs text-muted">{d.delivery_address}</p>
                </div>

          },
          { key: 'brand', header: 'Brand', render: (d) => <BrandTag name={d.brand_name} /> },
          { key: 'courier', header: 'Courier', render: (d) => <span className="text-muted">{d.courier_name ? `${d.courier_name}${d.tracking_number ? ` · ${d.tracking_number}` : ''}` : '—'}</span> },
          { key: 'eta', header: 'ETA', render: (d) => <span className="whitespace-nowrap">{formatDate(d.actual_delivery_date ?? d.estimated_delivery_date)}</span> },
          { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} label={d.status_display} /> },
          { key: 'act', header: '', align: 'right', render: (d) => <DeliveryActions delivery={d} onDispatch={setDispatching} onDeliver={setDelivering} onNote={(x) => setNoteId(x.id)} /> }]
          } />
        
      </Panel>
      <CreateDeliveryModal open={creating} onClose={() => setCreating(false)} onDone={() => {setCreating(false);reload();}} />
      <DispatchModal delivery={dispatching} onClose={() => setDispatching(null)} onDone={() => {setDispatching(null);reload();}} />
      <DeliverModal delivery={delivering} onClose={() => setDelivering(null)} onDone={() => {setDelivering(null);reload();}} />
      <DeliveryNoteModal deliveryId={noteId} onClose={() => setNoteId(null)} />
    </div>);

}