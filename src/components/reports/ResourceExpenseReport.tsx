import React, { useState } from 'react';
import { AlertTriangleIcon } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { api } from '../../utils/api';
import type { ResourcesExpenseReport, ResourceType } from '../../types/resources';
import { formatDate, formatMoney, formatNumber } from '../../utils/format';
import { formatQty } from '../../utils/resources';
import { resourceExpenseSpec } from '../../utils/costingReports';
import { Panel } from '../ui/Panel';
import { DataTable } from '../ui/DataTable';
import { StateMessage } from '../ui/StateMessage';
import { SegmentedControl } from '../ui/SegmentedControl';
import { ReportExportActions } from '../print/ReportExportActions';
import { cx, inputClass } from '../../utils/styles';

type TypeFilter = 'ALL' | ResourceType;

const TYPE_OPTIONS: {value: TypeFilter;label: string;}[] = [
{ value: 'ALL', label: 'All materials' },
{ value: 'FABRIC', label: 'Fabrics' },
{ value: 'OTHER', label: 'Other resources' }];


export function ResourceExpenseReport() {
  const [type, setType] = useState<TypeFilter>('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data, loading, error, reload } = useApi(
    () =>
    api.get<ResourcesExpenseReport>('/api/reports/resources-expense/', {
      resource_type: type === 'ALL' ? undefined : type,
      date_from: from,
      date_to: to
    }),
    [type, from, to]
  );

  const scopeLabel = [TYPE_OPTIONS.find((o) => o.value === type)?.label, from || to ? `${from || '…'} to ${to || '…'}` : 'All dates'].join(' · ');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <SegmentedControl label="Resource type" options={TYPE_OPTIONS} value={type} onChange={setType} />
          <div className="flex items-center gap-1.5">
            <label htmlFor="re-from" className="sr-only">From date</label>
            <input id="re-from" type="date" className={cx(inputClass, 'w-auto')} value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-xs text-faint">to</span>
            <label htmlFor="re-to" className="sr-only">To date</label>
            <input id="re-to" type="date" className={cx(inputClass, 'w-auto')} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <ReportExportActions spec={data ? resourceExpenseSpec(data, scopeLabel) : null} />
        </div>
      </div>

      {loading && !data ?
      <StateMessage kind="loading" /> :
      error || !data ?
      <StateMessage kind="error" message={error ?? 'No report data'} onRetry={reload} /> :

      <>
          <Panel>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <p className="text-xs text-muted">Spent on materials</p>
                <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">{formatMoney(data.summary.total_purchases_expense)}</p>
                <dl className="mt-6 grid gap-6 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted">Fabric</dt>
                    <dd className="mt-0.5 font-medium tabular-nums">{formatMoney(data.summary.fabric_purchases.total_cost)}</dd>
                    <dd className="text-xs text-muted">
                      {formatQty(data.summary.fabric_purchases.total_quantity_kg, 'kg')} · avg {formatMoney(data.summary.fabric_purchases.avg_cost_per_kg)}/kg
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Other resources</dt>
                    <dd className="mt-0.5 font-medium tabular-nums">{formatMoney(data.summary.other_resources_purchases.total_cost)}</dd>
                    <dd className="text-xs text-muted">{formatNumber(data.summary.other_resources_purchases.purchase_count)} purchases</dd>
                  </div>
                </dl>
              </div>
              <dl className="grid content-start gap-5 text-sm sm:grid-cols-2 lg:border-l lg:border-line lg:pl-8">
                <div>
                  <dt className="text-xs text-muted">Used in orders</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums">{formatMoney(data.summary.used_in_production_orders.total_materials_cost_consumed)}</dd>
                  <dd className="text-xs text-muted">
                    {formatQty(data.summary.used_in_production_orders.fabric_used_kg, 'kg')} fabric · {formatMoney(data.summary.used_in_production_orders.other_resources_used_cost)} other
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Still in stock</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums">{formatMoney(data.summary.current_inventory.total_stock_valuation)}</dd>
                  <dd className="text-xs text-muted">
                    {formatQty(data.summary.current_inventory.fabric_in_stock_kg, 'kg')} fabric · {formatNumber(data.summary.current_inventory.total_active_resources)} materials
                  </dd>
                </div>
              </dl>
            </div>
          </Panel>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Panel title="Purchases" description="Every material purchase recorded as an expense." flush className="min-w-0">
              <DataTable
              rows={data.purchases}
              loading={loading}
              getRowKey={(p) => p.id}
              emptyTitle="No purchases in this period"
              columns={[
              { key: 'date', header: 'Date', render: (p) => <span className="whitespace-nowrap text-muted">{formatDate(p.purchase_date)}</span> },
              {
                key: 'res',
                header: 'Material',
                render: (p) =>
                <div>
                        <p className="font-medium">{p.resource_name}</p>
                        <p className="text-xs text-muted">{p.supplier_name || 'No supplier'}{p.invoice_number ? ` · ${p.invoice_number}` : ''}</p>
                      </div>

              },
              { key: 'qty', header: 'Quantity', align: 'right', render: (p) => formatQty(p.quantity, p.unit_of_measurement) },
              { key: 'total', header: 'Expense', align: 'right', render: (p) => <span className="font-semibold">{formatMoney(p.total_cost)}</span> }]
              } />
            
            </Panel>
            <Panel title="Stock on hand" flush className="min-w-0">
              <DataTable
              rows={data.stock_inventory}
              loading={loading}
              getRowKey={(r) => r.id}
              rowClassName={(r) => r.is_low_stock ? 'bg-warn-soft/40' : ''}
              emptyTitle="No materials defined"
              columns={[
              {
                key: 'name',
                header: 'Material',
                render: (r) =>
                <div>
                        <p className="font-medium">{r.name}</p>
                        {r.is_low_stock && <p className="inline-flex items-center gap-1 text-xs text-warn"><AlertTriangleIcon className="h-3 w-3" /> Low stock</p>}
                      </div>

              },
              { key: 'qty', header: 'In stock', align: 'right', render: (r) => formatQty(r.current_stock_quantity, r.unit_of_measurement) },
              { key: 'val', header: 'Value', align: 'right', render: (r) => formatMoney(r.stock_valuation) }]
              } />
            
            </Panel>
          </div>
        </>
      }
    </div>);

}