import React, { useState } from 'react';
import { CheckCircle2Icon, ClockIcon } from 'lucide-react';
import { useBrands } from '../../contexts/BrandContext';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { api } from '../../utils/api';
import type { ManufacturingCostReport as Report, OrderCost } from '../../types/resources';
import { formatMoney, formatNumber, toNumber } from '../../utils/format';
import { formatQty, marginTone } from '../../utils/resources';
import { manufacturingCostSpec } from '../../utils/costingReports';
import { Panel } from '../ui/Panel';
import { DataTable } from '../ui/DataTable';
import { StateMessage } from '../ui/StateMessage';
import { SearchInput } from '../ui/SearchInput';
import { SegmentedControl } from '../ui/SegmentedControl';
import { ReportExportActions } from '../print/ReportExportActions';
import { OrderCostModal } from './OrderCostModal';
import { cx, inputClass } from '../../utils/styles';

type Status = 'finished' | 'in_progress' | 'all';

const STATUS_OPTIONS: {value: Status;label: string;}[] = [
{ value: 'finished', label: 'Manufacture finished' },
{ value: 'in_progress', label: 'In production' },
{ value: 'all', label: 'All orders' }];


export function ManufacturingCostReport() {
  const { scope, scopedBrand } = useBrands();
  const [status, setStatus] = useState<Status>('finished');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const q = useDebounce(search);

  const { data, loading, error, reload } = useApi(
    () =>
    api.get<Report>('/api/reports/manufacturing-cost/', {
      manufacture_finished: status === 'all' ? undefined : status === 'finished',
      brand_id: scope,
      order_id: q.trim(),
      date_from: from,
      date_to: to
    }),
    [status, scope, q, from, to]
  );

  const scopeLabel = [STATUS_OPTIONS.find((o) => o.value === status)?.label, scopedBrand?.name ?? 'All brands', from || to ? `${from || '…'} to ${to || '…'}` : null].
  filter(Boolean).
  join(' · ');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <SegmentedControl label="Manufacturing status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
          <SearchInput value={search} onChange={setSearch} placeholder="Order ID" className="w-44" />
          <div className="flex items-center gap-1.5">
            <label htmlFor="mc-from" className="sr-only">From date</label>
            <input id="mc-from" type="date" className={cx(inputClass, 'w-auto')} value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-xs text-faint">to</span>
            <label htmlFor="mc-to" className="sr-only">To date</label>
            <input id="mc-to" type="date" className={cx(inputClass, 'w-auto')} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <ReportExportActions spec={data ? manufacturingCostSpec(data, scopeLabel) : null} brandId={scope} />
        </div>
      </div>

      {loading && !data ?
      <StateMessage kind="loading" title="Calculating order costs…" /> :
      error || !data ?
      <StateMessage kind="error" message={error ?? 'No report data'} onRetry={reload} /> :

      <>
          <Totals report={data} />
          <Panel title="Orders" description="Select an order to see its cost per unit for every item." flush>
            <DataTable<OrderCost>
            rows={data.orders}
            loading={loading}
            getRowKey={(o) => o.order_id}
            onRowClick={(o) => setSelected(o.order_id)}
            emptyTitle={status === 'finished' ? 'No finished orders yet' : 'No orders match these filters'}
            emptyMessage={status === 'finished' ? 'Orders appear here once every manufacturing step is complete.' : undefined}
            columns={[
            {
              key: 'order',
              header: 'Order',
              render: (o) =>
              <div className="min-w-0">
                      <p className="font-mono text-xs font-medium">{o.order_id}</p>
                      <p className="max-w-[220px] truncate text-xs text-muted">{o.customer}</p>
                    </div>

            },
            {
              key: 'state',
              header: 'Manufacture',
              render: (o) =>
              o.is_manufacture_finished ?
              <span className="inline-flex items-center gap-1 text-xs font-medium text-ok"><CheckCircle2Icon className="h-3.5 w-3.5" /> Finished</span> :

              <span className="inline-flex items-center gap-1 text-xs text-muted"><ClockIcon className="h-3.5 w-3.5" /> In progress</span>

            },
            { key: 'units', header: 'Units', align: 'right', render: (o) => formatNumber(o.total_units_produced) },
            { key: 'rev', header: 'Revenue', align: 'right', render: (o) => formatMoney(o.financials.revenue) },
            { key: 'cost', header: 'Cost to make', align: 'right', render: (o) => formatMoney(o.financials.total_manufacturing_cost) },
            { key: 'cpu', header: 'Cost / unit', align: 'right', render: (o) => <span className="text-muted">{formatMoney(o.financials.cost_per_unit_average)}</span> },
            {
              key: 'profit',
              header: 'Profit',
              align: 'right',
              render: (o) => <span className={cx('font-semibold', toNumber(o.financials.net_profit) < 0 && 'text-danger')}>{formatMoney(o.financials.net_profit)}</span>
            },
            {
              key: 'margin',
              header: 'Margin',
              align: 'right',
              render: (o) => <span className={marginTone(o.financials.profit_margin_percent)}>{o.financials.profit_margin_percent.toFixed(1)}%</span>
            }]
            } />
          
          </Panel>
        </>
      }

      <OrderCostModal orderCode={selected} onClose={() => setSelected(null)} />
    </div>);

}

function Totals({ report }: {report: Report;}) {
  const t = report.aggregate_totals;
  const parts = [
  { label: 'Fabric', value: toNumber(t.total_fabric_cost), note: t.total_fabric_quantity_kg ? formatQty(t.total_fabric_quantity_kg, 'kg') : undefined, tone: 'bg-accent' },
  { label: 'Other resources', value: toNumber(t.total_other_resources_cost), tone: 'bg-standard' },
  { label: 'Other expenses', value: toNumber(t.total_other_expenses_cost), tone: 'bg-premium' }];

  const total = toNumber(t.total_manufacturing_cost) || 1;
  const profit = toNumber(t.total_gross_profit);

  return (
    <Panel>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="text-xs text-muted">Gross profit · {formatNumber(t.total_orders_reported)} orders</p>
          <p className={cx('mt-1 text-4xl font-semibold tracking-tight tabular-nums', profit < 0 ? 'text-danger' : 'text-ink')}>{formatMoney(t.total_gross_profit)}</p>
          <p className={cx('mt-1 text-sm font-medium', marginTone(t.overall_profit_margin_percent))}>{t.overall_profit_margin_percent.toFixed(1)}% overall margin</p>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted">Revenue</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{formatMoney(t.total_revenue)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Units made</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{formatNumber(t.total_units_manufactured)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Avg sell / unit</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{formatMoney(t.average_selling_price_per_unit)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Avg cost / unit</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{formatMoney(t.average_cost_per_unit)}</dd>
            </div>
          </dl>
        </div>
        <div className="lg:border-l lg:border-line lg:pl-8">
          <p className="text-xs text-muted">Cost to make</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{formatMoney(t.total_manufacturing_cost)}</p>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
            {parts.map((p) => p.value > 0 ? <div key={p.label} className={p.tone} style={{ width: `${p.value / total * 100}%` }} /> : null)}
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {parts.map((p) =>
            <li key={p.label} className="flex items-baseline justify-between gap-3">
                <span className="flex items-baseline gap-2">
                  <span className={cx('h-2 w-2 shrink-0 rounded-sm', p.tone)} aria-hidden="true" />
                  {p.label}
                  {p.note && <span className="text-xs text-faint">{p.note}</span>}
                </span>
                <span className="tabular-nums">{formatMoney(p.value)}</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </Panel>);

}