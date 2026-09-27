import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, ArrowRightIcon, BoxesIcon, ListChecksIcon, XCircleIcon, PhoneIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { useAction } from '../../hooks/useAction';
import { api } from '../../utils/api';
import type { OrderDetail } from '../../types/api';
import { canSetStatus, nextStatus } from '../../data/workflow';
import { formatDate, formatMoney, humanize, toNumber } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Panel } from '../../components/ui/Panel';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BrandTag } from '../../components/ui/BrandTag';
import { StateMessage } from '../../components/ui/StateMessage';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { OrderPipeline } from '../../components/orders/OrderPipeline';
import { OrderOverviewTab } from '../../components/orders/OrderOverviewTab';
import { OrderArtworkTab } from '../../components/orders/OrderArtworkTab';
import { OrderProductionTab } from '../../components/orders/OrderProductionTab';
import { OrderDeliveryTab } from '../../components/orders/OrderDeliveryTab';
import { OrderBillingTab } from '../../components/orders/OrderBillingTab';
import { OrderDocumentsTab } from '../../components/orders/OrderDocumentsTab';
import { OrderTimelineTab } from '../../components/orders/OrderTimelineTab';
import { StatusUpdateModal } from '../../components/workflow/StatusUpdateModal';

type Tab = 'overview' | 'artwork' | 'production' | 'delivery' | 'billing' | 'documents' | 'timeline';

export function OrderDetailPage() {
  const { id } = useParams();
  const { role, hasRole } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [statusOpen, setStatusOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const { data: order, loading, error, reload } = useApi(() => api.get<OrderDetail>(`/api/orders/orders/${id}/`), [id]);
  const { run, pending } = useAction();

  if (loading && !order) return <StateMessage kind="loading" title="Loading order…" />;
  if (error || !order) return <StateMessage kind="error" message={error ?? 'Order not found'} onRetry={reload} />;

  const next = nextStatus(order.status);
  const canAdvance = !!next && canSetStatus(role, next) && order.status !== 'CANCELLED';
  const closed = order.status === 'CANCELLED' || order.status === 'ORDER_CLOSED';
  const canCancel = hasRole('ADMIN', 'SALES') && !closed;
  const canReserve = hasRole('ADMIN', 'SALES', 'STORE_KEEPER') && !closed && !(order.stock_reservations ?? []).some((r) => r.status === 'RESERVED' || r.status === 'ISSUED');

  const reserve = async () => {
    const res = await run(() => api.post(`/api/orders/orders/${order.id}/reserve-stock/`), 'Stock reserved');
    if (res !== undefined) reload();
  };
  const cancel = async () => {
    const res = await run(() => api.post(`/api/orders/orders/${order.id}/cancel/`), 'Order cancelled and stock released');
    if (res !== undefined) {
      setCancelOpen(false);
      reload();
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeftIcon className="h-4 w-4" /> Orders
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight">{order.order_id}</h1>
            <BrandTag name={order.brand_name} />
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1.5 text-sm text-muted">
            <Link to={`/customers/${order.customer}`} className="font-medium text-ink hover:underline">{order.customer_company || order.customer_name}</Link>
            {' · '}{order.customer_name}
            {order.customer_phone &&
            <a href={`tel:${order.customer_phone}`} className="ml-2 inline-flex items-center gap-1 hover:text-ink"><PhoneIcon className="h-3 w-3" />{order.customer_phone}</a>
            }
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCancel && <Button variant="ghost" icon={XCircleIcon} onClick={() => setCancelOpen(true)}>Cancel order</Button>}
          {canReserve && <Button icon={BoxesIcon} loading={pending} onClick={reserve}>Reserve stock</Button>}
          {!closed && <Button icon={ListChecksIcon} onClick={() => setStatusOpen(true)}>Change status</Button>}
          {canAdvance && next &&
          <Button variant="primary" icon={ArrowRightIcon} onClick={() => setStatusOpen(true)}>
              Move to {humanize(next)}
            </Button>
          }
        </div>
      </header>

      <Panel>
        {order.status === 'CANCELLED' ?
        <p className="text-sm text-danger">This order was cancelled. Reserved stock has been released; the record is kept for history.</p> :

        <OrderPipeline status={order.status} />
        }
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <Panel flush className="min-w-0">
          <div className="px-4 pt-1">
            <Tabs<Tab>
              tabs={[
              { id: 'overview', label: 'Items' },
              { id: 'artwork', label: 'Artwork', count: order.artworks?.length },
              { id: 'production', label: 'Production' },
              { id: 'delivery', label: 'Delivery' },
              { id: 'billing', label: 'Billing' },
              { id: 'documents', label: 'Documents', count: order.documents?.length },
              { id: 'timeline', label: 'History' }]
              }
              active={tab}
              onChange={setTab} />
            
          </div>
          {tab === 'overview' && <OrderOverviewTab order={order} />}
          {tab === 'artwork' && <OrderArtworkTab order={order} onChanged={reload} />}
          {tab === 'production' && <OrderProductionTab order={order} onChanged={reload} />}
          {tab === 'delivery' && <OrderDeliveryTab order={order} onChanged={reload} />}
          {tab === 'billing' && <OrderBillingTab order={order} onChanged={reload} />}
          {tab === 'documents' && <OrderDocumentsTab order={order} onChanged={reload} />}
          {tab === 'timeline' && <OrderTimelineTab orderId={order.id} />}
        </Panel>

        <aside className="space-y-6">
          <Panel>
            <p className="text-xs text-muted">Order total</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{formatMoney(order.total_amount)}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full bg-accent" style={{ width: `${toNumber(order.total_amount) ? Math.min(100, toNumber(order.paid_amount) / toNumber(order.total_amount) * 100) : 0}%` }} />
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Paid</dt><dd className="tabular-nums">{formatMoney(order.paid_amount)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Balance</dt><dd className={`tabular-nums ${toNumber(order.balance_amount) > 0 ? 'font-medium text-danger' : ''}`}>{formatMoney(order.balance_amount)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Deposit required</dt><dd className="tabular-nums">{formatMoney(order.deposit_required)}</dd></div>
            </dl>
          </Panel>
          <Panel>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-xs text-muted">Expected delivery</dt><dd className="font-medium">{formatDate(order.expected_delivery_date)}</dd></div>
              <div><dt className="text-xs text-muted">Delivery address</dt><dd>{order.delivery_address || '—'}</dd></div>
              <div><dt className="text-xs text-muted">Created by</dt><dd>{order.created_by_name ?? '—'} · {formatDate(order.created_at)}</dd></div>
            </dl>
          </Panel>
        </aside>
      </div>

      <StatusUpdateModal open={statusOpen} orderId={order.id} current={order.status} onClose={() => setStatusOpen(false)} onDone={() => {setStatusOpen(false);reload();}} />
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancel}
        pending={pending}
        danger
        title={`Cancel ${order.order_id}?`}
        message="The order is marked Cancelled and all reserved blanks go back to available stock. The record and its history are kept."
        confirmLabel="Cancel order" />
      
    </div>);

}