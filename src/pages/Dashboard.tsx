import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangleIcon, ArrowRightIcon, CheckCircle2Icon, InfoIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBrands } from '../contexts/BrandContext';
import { useApi } from '../hooks/useApi';
import { api } from '../utils/api';
import type { AlertsResponse, DashboardData, Order } from '../types/api';
import { formatDate, formatMoney, humanize, toNumber } from '../utils/format';
import { ORDER_PIPELINE } from '../data/workflow';
import { Panel } from '../components/ui/Panel';
import { StateMessage } from '../components/ui/StateMessage';
import { StatusBadge } from '../components/ui/StatusBadge';
import { BrandTag, isPremium } from '../components/ui/BrandTag';
import { DataTable } from '../components/ui/DataTable';
import { cx } from '../utils/styles';

export function Dashboard() {
  const { user, hasRole } = useAuth();
  const { scope } = useBrands();
  const navigate = useNavigate();
  const dash = useApi(() => api.get<DashboardData>('/api/analytics/dashboard/'), []);
  const alerts = useApi(() => api.get<AlertsResponse>('/api/analytics/alerts/', { for_my_role: true }), []);
  const orders = useApi(() => api.list<Order>('/api/orders/orders/', { brand: scope }), [scope]);
  const showFinance = hasRole('ADMIN', 'ACCOUNTS', 'SALES');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted">{formatDate(new Date().toISOString())}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-ink">
          {greeting}{user?.first_name ? `, ${user.first_name}` : ''}
        </h1>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="Needs attention"
          description="Automatic alerts for your department"
          className="xl:col-span-2"
          flush
          actions={alerts.data && <span className="text-xs text-muted tabular-nums">{alerts.data.total_alerts} open</span>}>
          
          {alerts.loading && !alerts.data ?
          <StateMessage kind="loading" /> :
          alerts.error ?
          <StateMessage kind="error" message={alerts.error} onRetry={alerts.reload} /> :
          !alerts.data || alerts.data.alerts.length === 0 ?
          <div className="flex items-center gap-3 px-5 py-10 text-sm text-muted">
              <CheckCircle2Icon className="h-5 w-5 text-ok" aria-hidden="true" />
              All clear — nothing is waiting on your team right now.
            </div> :

          <ul className="divide-y divide-line">
              {alerts.data.alerts.slice(0, 8).map((a, i) => {
              const Icon = a.severity === 'INFO' ? InfoIcon : AlertTriangleIcon;
              return (
                <li key={`${a.type}-${a.order_id}-${i}`} className="flex items-start gap-3 px-5 py-3.5">
                    <Icon className={cx('mt-0.5 h-4 w-4 shrink-0', a.severity === 'CRITICAL' ? 'text-danger' : a.severity === 'WARNING' ? 'text-warn' : 'text-info')} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{a.title}</p>
                      <p className="mt-0.5 text-sm text-muted">{a.message}</p>
                    </div>
                    {a.order_id &&
                  <Link to={`/orders?search=${a.order_id}`} className="shrink-0 font-mono text-xs text-accent hover:underline">
                        {a.order_id}
                      </Link>
                  }
                  </li>);

            })}
            </ul>
          }
        </Panel>

        {showFinance &&
        <Panel title="Receivables">
            {dash.loading && !dash.data ?
          <StateMessage kind="loading" /> :
          dash.error ?
          <StateMessage kind="error" message={dash.error} onRetry={dash.reload} /> :
          dash.data ?
          <div>
                <p className="text-xs text-muted">Outstanding balance</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-ink tabular-nums">{formatMoney(dash.data.financial_kpis.total_outstanding)}</p>
                <CollectionBar collected={dash.data.financial_kpis.total_collected} revenue={dash.data.financial_kpis.total_revenue} />
                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Total revenue</dt>
                    <dd className="mt-0.5 font-medium tabular-nums">{formatMoney(dash.data.financial_kpis.total_revenue)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Collected</dt>
                    <dd className="mt-0.5 font-medium tabular-nums">{formatMoney(dash.data.financial_kpis.total_collected)}</dd>
                  </div>
                </dl>
              </div> :
          null}
          </Panel>
        }
      </div>

      {dash.data &&
      <div className="grid gap-6 lg:grid-cols-5">
          <Panel title="Orders by stage" description={`${dash.data.order_kpis.active_orders} active of ${dash.data.order_kpis.total_orders} total`} className="lg:col-span-3">
            <StageBreakdown breakdown={dash.data.order_kpis.status_breakdown} />
          </Panel>
          <Panel title="Brand comparison" className="lg:col-span-2">
            <BrandComparison rows={dash.data.brand_comparison} />
          </Panel>
        </div>
      }

      <Panel title="Recent orders" flush actions={<Link to="/orders" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">All orders <ArrowRightIcon className="h-3 w-3" /></Link>}>
        <DataTable
          rows={orders.data ? orders.data.slice(0, 8) : null}
          loading={orders.loading}
          error={orders.error}
          onRetry={orders.reload}
          getRowKey={(o) => o.id}
          onRowClick={(o) => navigate(`/orders/${o.id}`)}
          emptyTitle="No orders yet"
          columns={[
          { key: 'id', header: 'Order', render: (o) => <span className="font-mono text-xs font-medium">{o.order_id}</span> },
          { key: 'customer', header: 'Customer', render: (o) => o.customer_company || o.customer_name },
          { key: 'brand', header: 'Brand', render: (o) => <BrandTag name={o.brand_name} /> },
          { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
          { key: 'due', header: 'Delivery due', render: (o) => formatDate(o.expected_delivery_date) },
          { key: 'total', header: 'Total', align: 'right', render: (o) => formatMoney(o.total_amount) }]
          } />
        
      </Panel>
    </div>);

}

function CollectionBar({ collected, revenue }: {collected: string;revenue: string;}) {
  const pct = toNumber(revenue) > 0 ? Math.min(100, toNumber(collected) / toNumber(revenue) * 100) : 0;
  return (
    <div className="mt-4">
      <div className="h-2 overflow-hidden rounded-full bg-canvas" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Collected share of revenue">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-muted">{Math.round(pct)}% of billed revenue collected</p>
    </div>);

}

function StageBreakdown({ breakdown }: {breakdown: Record<string, number>;}) {
  const entries = Object.entries(breakdown).sort((a, b) => ORDER_PIPELINE.indexOf(a[0] as never) - ORDER_PIPELINE.indexOf(b[0] as never));
  const max = Math.max(1, ...entries.map(([, v]) => v));
  if (entries.length === 0) return <p className="text-sm text-muted">No active orders.</p>;
  return (
    <ul className="space-y-2.5">
      {entries.map(([status, count]) =>
      <li key={status} className="grid grid-cols-[150px_1fr_32px] items-center gap-3 text-sm">
          <Link to={`/orders?status=${status}`} className="truncate text-muted hover:text-ink">
            {humanize(status)}
          </Link>
          <div className="h-2 rounded-full bg-canvas">
            <div className="h-full rounded-full bg-ink/80" style={{ width: `${count / max * 100}%` }} />
          </div>
          <span className="text-right font-medium tabular-nums">{count}</span>
        </li>
      )}
    </ul>);

}

function BrandComparison({ rows }: {rows: DashboardData['brand_comparison'];}) {
  const total = rows.reduce((s, r) => s + toNumber(r.revenue), 0) || 1;
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-canvas">
        {rows.map((r) =>
        <div key={r.brand_id} className={isPremium(r.brand_name) ? 'bg-premium' : 'bg-standard'} style={{ width: `${toNumber(r.revenue) / total * 100}%` }} />
        )}
      </div>
      <ul className="mt-5 space-y-4">
        {rows.map((r) =>
        <li key={r.brand_id} className="flex items-start justify-between gap-3">
            <div>
              <BrandTag name={r.brand_name} />
              <p className="mt-1 text-xs text-muted">{r.positioning}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums">{formatMoney(r.revenue)}</p>
              <p className="text-xs text-muted">{r.orders_count} orders</p>
            </div>
          </li>
        )}
      </ul>
    </div>);

}