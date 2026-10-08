import React from 'react';
import type { OrderCost } from '../../types/resources';
import { formatMoney, formatNumber, toNumber } from '../../utils/format';
import { formatQty, marginTone } from '../../utils/resources';
import { cx } from '../../utils/styles';

interface CostBreakdownProps {
  cost: OrderCost;
  showResources?: boolean;
}

/** Order economics: profit headline, what the cost is made of, and per-unit numbers for every line item. */
export function CostBreakdown({ cost, showResources = true }: CostBreakdownProps) {
  const f = cost.financials;
  const parts = [
  { label: 'Fabric', value: toNumber(f.fabric_cost), note: f.fabric_quantity_kg ? formatQty(f.fabric_quantity_kg, 'kg') : undefined, tone: 'bg-accent' },
  { label: 'Other resources', value: toNumber(f.other_resources_cost), tone: 'bg-standard' },
  { label: 'Other expenses', value: toNumber(f.other_expenses_cost), note: 'Labour, printing, packaging…', tone: 'bg-premium' }];

  const totalCost = toNumber(f.total_manufacturing_cost) || 1;
  const profit = toNumber(f.net_profit);
  const items = cost.items_breakdown ?? [];
  const resources = cost.resources_used ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div>
          <p className="text-xs text-muted">{cost.is_manufacture_finished ? 'Net profit' : 'Projected profit so far'}</p>
          <p className={cx('mt-1 text-3xl font-semibold tracking-tight tabular-nums', profit < 0 ? 'text-danger' : 'text-ink')}>{formatMoney(f.net_profit)}</p>
          <p className={cx('mt-0.5 text-sm font-medium', marginTone(f.profit_margin_percent))}>{f.profit_margin_percent.toFixed(1)}% margin</p>
          <dl className="mt-5 grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted">Revenue</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{formatMoney(f.revenue)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Cost to make</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{formatMoney(f.total_manufacturing_cost)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Avg cost / unit</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{formatMoney(f.cost_per_unit_average)}</dd>
              <dd className="text-[11px] text-faint">{formatNumber(cost.total_units_produced)} units</dd>
            </div>
          </dl>
        </div>

        <div>
          <p className="text-xs text-muted">What the cost is made of</p>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
            {parts.map((p) => p.value > 0 ? <div key={p.label} className={p.tone} style={{ width: `${p.value / totalCost * 100}%` }} /> : null)}
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {parts.map((p) =>
            <li key={p.label} className="flex items-baseline justify-between gap-3">
                <span className="flex items-baseline gap-2">
                  <span className={cx('h-2 w-2 shrink-0 translate-y-[-1px] rounded-sm', p.tone)} aria-hidden="true" />
                  <span>{p.label}</span>
                  {p.note && <span className="text-xs text-faint">{p.note}</span>}
                </span>
                <span className="tabular-nums">{formatMoney(p.value)}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Per unit, by item</h3>
        {items.length === 0 ?
        <p className="mt-2 text-sm text-muted">No line items to break down.</p> :

        <div className="mt-2 overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-canvas/60 text-xs text-faint">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Item</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Qty</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Sell / unit</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Cost / unit</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Profit / unit</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Margin</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Item profit</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) =>
              <tr key={i.item_id} className="border-b border-line/70 last:border-0">
                    <td className="px-3 py-2.5">
                      <p className="font-medium">{i.product_name}</p>
                      <p className="text-xs text-muted">{[i.colour, i.size, i.fabric_gsm, i.printing_method].filter(Boolean).join(' · ')}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(i.quantity)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(i.unit_selling_price)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(i.unit_manufacturing_cost)}</td>
                    <td className={cx('px-3 py-2.5 text-right font-semibold tabular-nums', toNumber(i.unit_profit) < 0 && 'text-danger')}>{formatMoney(i.unit_profit)}</td>
                    <td className={cx('px-3 py-2.5 text-right tabular-nums', marginTone(i.profit_margin_percent))}>{i.profit_margin_percent.toFixed(1)}%</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted">{formatMoney(i.total_profit)}</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
      </div>

      {showResources &&
      <div>
          <h3 className="text-sm font-semibold">Materials used</h3>
          {resources.length === 0 ?
        <p className="mt-2 text-sm text-muted">No materials were allocated to this order.</p> :

        <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
              {resources.map((r) =>
          <li key={r.id} className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.resource_name}</p>
                    <p className="text-xs text-muted">
                      {formatQty(r.quantity_used, r.unit_of_measurement)} × {formatMoney(r.unit_cost)}
                      {r.notes ? ` · ${r.notes}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 tabular-nums">{formatMoney(r.total_cost)}</span>
                </li>
          )}
            </ul>
        }
        </div>
      }
    </div>);

}