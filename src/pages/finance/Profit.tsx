import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CoinsIcon } from 'lucide-react';
import { useBrands } from '../../contexts/BrandContext';
import { useApi } from '../../hooks/useApi';
import { api } from '../../utils/api';
import type { Expense, ProfitRow } from '../../types/api';
import { formatDate, formatMoney, humanize, toNumber } from '../../utils/format';
import { EXPENSE_TYPES } from '../../data/workflow';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { StateMessage } from '../../components/ui/StateMessage';
import { Tabs } from '../../components/ui/Tabs';
import { BrandTag } from '../../components/ui/BrandTag';
import { ExpenseFormModal } from '../../components/workflow/ExpenseFormModal';
import { ReportExportActions } from '../../components/print/ReportExportActions';
import { profitReport } from '../../utils/reports';
import { cx } from '../../utils/styles';

type View = 'by_order' | 'by_brand' | 'by_month';

function extractRows(data: unknown): ProfitRow[] {
  if (Array.isArray(data)) return data as ProfitRow[];
  if (data && typeof data === 'object') {
    const arr = Object.values(data as Record<string, unknown>).find(Array.isArray);
    if (arr) return arr as ProfitRow[];
  }
  return [];
}

export function ProfitPage() {
  const { scope, scopedBrand } = useBrands();
  const [view, setView] = useState<View>('by_order');
  const [adding, setAdding] = useState(false);
  const profit = useApi(() => api.get<unknown>('/api/analytics/profit/', { view, brand: scope }).then(extractRows), [view, scope]);
  const expenses = useApi(() => api.list<Expense>('/api/analytics/expenses/'), []);
  const rows = profit.data ?? [];
  const totals = rows.reduce(
    (acc, r) => ({ revenue: acc.revenue + toNumber(r.revenue), cost: acc.cost + toNumber(r.total_cost), profit: acc.profit + toNumber(r.net_profit) }),
    { revenue: 0, cost: 0, profit: 0 }
  );
  const margin = totals.revenue ? totals.profit / totals.revenue * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profit & expenses"
        description="Revenue − T-shirt cost − Printing − Labour − Packaging − Delivery − Other = Profit, by order, brand or month."
        actions={
        <>
            <ReportExportActions spec={rows.length ? profitReport(rows, view, scopedBrand?.name ?? 'All brands') : null} brandId={scope} />
            <Button variant="primary" icon={CoinsIcon} onClick={() => setAdding(true)}>Record expense</Button>
          </>
        } />
      

      <Panel>
        <div className="grid gap-6 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="text-xs text-muted">Net profit</p>
            <p className={cx('mt-1 text-3xl font-semibold tracking-tight tabular-nums', totals.profit < 0 ? 'text-danger' : 'text-ink')}>{formatMoney(totals.profit)}</p>
          </div>
          <div><p className="text-xs text-muted">Revenue</p><p className="mt-1 text-lg font-medium tabular-nums">{formatMoney(totals.revenue)}</p></div>
          <div><p className="text-xs text-muted">Total cost</p><p className="mt-1 text-lg font-medium tabular-nums">{formatMoney(totals.cost)}</p></div>
          <div><p className="text-xs text-muted">Margin</p><p className="mt-1 text-lg font-medium tabular-nums">{margin.toFixed(1)}%</p></div>
        </div>
      </Panel>

      <Panel flush>
        <div className="px-4 pt-1">
          <Tabs<View> tabs={[{ id: 'by_order', label: 'By order' }, { id: 'by_brand', label: 'By brand' }, { id: 'by_month', label: 'By month' }]} active={view} onChange={setView} />
        </div>
        {profit.loading && !profit.data ?
        <StateMessage kind="loading" /> :
        profit.error ?
        <StateMessage kind="error" message={profit.error} onRetry={profit.reload} /> :
        rows.length === 0 ?
        <StateMessage kind="empty" title="No profit data yet" message="Record expenses against orders to see profit." /> :

        <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-line text-xs text-faint">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">{view === 'by_order' ? 'Order' : view === 'by_brand' ? 'Brand' : 'Month'}</th>
                  <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
                  {EXPENSE_TYPES.map((t) => <th key={t.value} className="px-3 py-2.5 text-right font-medium">{t.label}</th>)}
                  <th className="px-4 py-2.5 text-right font-medium">Profit</th>
                  <th className="px-4 py-2.5 text-right font-medium">Margin</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) =>
              <tr key={`${r.order_id ?? r.brand ?? r.month}-${i}`} className="border-b border-line/70 last:border-0">
                    <td className="px-4 py-3">
                      {view === 'by_order' ?
                  <div>
                          <Link to={`/orders?search=${r.order_id}`} className="font-mono text-xs font-medium text-accent hover:underline">{r.order_id}</Link>
                          <p className="text-xs text-muted">{r.customer}</p>
                        </div> :
                  view === 'by_brand' ?
                  <BrandTag name={r.brand} /> :

                  <span className="font-medium">{r.month}</span>
                  }
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatMoney(r.revenue)}</td>
                    {EXPENSE_TYPES.map((t) =>
                <td key={t.value} className="px-3 py-3 text-right text-muted tabular-nums">{r.costs?.[t.value] ? formatMoney(r.costs[t.value], { compact: true }) : '—'}</td>
                )}
                    <td className={cx('px-4 py-3 text-right font-semibold tabular-nums', toNumber(r.net_profit) < 0 ? 'text-danger' : 'text-ok')}>{formatMoney(r.net_profit)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.profit_margin_percent}%</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
      </Panel>

      <Panel title="Recent expenses" flush>
        <DataTable
          rows={expenses.data ? expenses.data.slice(0, 25) : null}
          loading={expenses.loading}
          error={expenses.error}
          onRetry={expenses.reload}
          getRowKey={(e) => e.id}
          emptyTitle="No expenses recorded"
          columns={[
          { key: 'date', header: 'Date', render: (e) => <span className="whitespace-nowrap">{formatDate(e.expense_date)}</span> },
          { key: 'order', header: 'Order', render: (e) => <span className="font-mono text-xs">{e.order_code}</span> },
          { key: 'type', header: 'Type', render: (e) => e.expense_type_display ?? humanize(e.expense_type) },
          { key: 'desc', header: 'Description', render: (e) => <span className="text-muted">{e.description || '—'}</span> },
          { key: 'kind', header: '', render: (e) => <span className="text-xs text-faint">{e.is_actual ? 'Actual' : 'Estimate'}</span> },
          { key: 'amt', header: 'Amount', align: 'right', render: (e) => formatMoney(e.amount) }]
          } />
        
      </Panel>

      <ExpenseFormModal open={adding} onClose={() => setAdding(false)} onDone={() => {setAdding(false);profit.reload();expenses.reload();}} />
    </div>);

}