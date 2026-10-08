import React from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { api } from '../../utils/api';
import type { ReportsData } from '../../types/api';
import { formatMoney, formatNumber, toNumber } from '../../utils/format';
import { Panel } from '../ui/Panel';
import { StateMessage } from '../ui/StateMessage';
import { BrandTag, isPremium } from '../ui/BrandTag';
import { ReportExportActions } from '../print/ReportExportActions';
import { salesReport } from '../../utils/reports';

export function SalesReport() {
  const { data, loading, error, reload } = useApi(() => api.get<ReportsData>('/api/analytics/reports/'), []);

  if (loading && !data) return <StateMessage kind="loading" />;
  if (error || !data) return <StateMessage kind="error" message={error ?? 'No report data'} onRetry={reload} />;

  const brandTotal = data.sales_by_brand.reduce((s, b) => s + toNumber(b.total_sales), 0) || 1;
  const topCustomerMax = Math.max(1, ...data.top_customers.map((c) => toNumber(c.total_purchases)));

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <ReportExportActions spec={salesReport(data)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Sales by brand" className="lg:col-span-2">
          <div className="grid gap-6 sm:grid-cols-2">
            {data.sales_by_brand.map((b) => {
              const share = toNumber(b.total_sales) / brandTotal * 100;
              return (
                <div key={b.brand}>
                  <BrandTag name={b.brand} />
                  <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{formatMoney(b.total_sales)}</p>
                  <p className="text-xs text-muted">{b.orders_count} orders · {share.toFixed(0)}% of sales</p>
                  <div className="mt-3 h-1.5 rounded-full bg-canvas">
                    <div className={`h-full rounded-full ${isPremium(b.brand) ? 'bg-premium' : 'bg-standard'}`} style={{ width: `${share}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-faint">{b.positioning}</p>
                </div>);

            })}
          </div>
        </Panel>
        <Panel title="Cancelled orders">
          <p className="text-4xl font-semibold tracking-tight tabular-nums">{data.cancelled_orders_count}</p>
          <p className="mt-1 text-sm text-muted">Cancelled records are kept for history, never deleted.</p>
          <Link to="/orders?status=CANCELLED" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">View cancelled orders</Link>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Best customers" flush>
          {data.top_customers.length === 0 ?
          <StateMessage kind="empty" title="No customer sales yet" /> :

          <ol className="divide-y divide-line">
              {data.top_customers.map((c, i) =>
            <li key={c.customer_id} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-5 text-sm text-faint tabular-nums">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/customers/${c.customer_id}`} className="block truncate text-sm font-medium hover:underline">{c.customer_name}</Link>
                    <div className="mt-1.5 h-1 rounded-full bg-canvas">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${toNumber(c.total_purchases) / topCustomerMax * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">{formatMoney(c.total_purchases)}</p>
                    <p className="text-xs text-muted">{c.orders_count} orders</p>
                  </div>
                </li>
            )}
            </ol>
          }
        </Panel>
        <Panel title="Best-selling products" flush>
          {data.top_products.length === 0 ?
          <StateMessage kind="empty" title="No product sales yet" /> :

          <table className="w-full text-sm">
              <thead className="border-b border-line text-xs text-faint">
                <tr>
                  <th className="px-5 py-2.5 text-left font-medium">Product</th>
                  <th className="px-5 py-2.5 text-right font-medium">Units</th>
                  <th className="px-5 py-2.5 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.top_products.map((p) =>
              <tr key={`${p.product_name}-${p.brand}`} className="border-b border-line/70 last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium">{p.product_name}</p>
                      <BrandTag name={p.brand} className="mt-1" />
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatNumber(p.units_sold)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatMoney(p.revenue)}</td>
                  </tr>
              )}
              </tbody>
            </table>
          }
        </Panel>
      </div>
    </div>);

}