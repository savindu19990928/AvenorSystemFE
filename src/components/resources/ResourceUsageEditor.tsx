import React from 'react';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import type { DraftResourceUsage, Resource } from '../../types/resources';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { formatMoney, toNumber } from '../../utils/format';
import { draftResourcesCost, formatQty, newDraftResource, resourcesForBrand } from '../../utils/resources';
import { Button } from '../ui/Button';
import { cx, inputClass } from '../../utils/styles';

interface ResourceUsageEditorProps {
  brandId: number | null;
  value: DraftResourceUsage[];
  onChange: (value: DraftResourceUsage[]) => void;
}

/** Fabrics (kg) and other resources this order will consume — deducted from material stock on confirm. */
export function ResourceUsageEditor({ brandId, value, onChange }: ResourceUsageEditorProps) {
  const { data, loading, error, reload } = useApi(() => api.list<Resource>('/api/inventory/resources/', { is_active: true }), []);
  const resources = resourcesForBrand(data ?? [], brandId);
  const estimate = draftResourcesCost(value, resources);

  const update = (key: string, patch: Partial<DraftResourceUsage>) => onChange(value.map((d) => d.key === key ? { ...d, ...patch } : d));
  const remove = (key: string) => onChange(value.filter((d) => d.key !== key));

  return (
    <section aria-labelledby="res-usage-title">
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <div>
          <p id="res-usage-title" className="text-xs font-medium text-ink">Materials for this order</p>
          <p className="text-xs text-faint">Fabric in kg and other resources in their own unit. Used to work out the cost of making the order.</p>
        </div>
        {estimate > 0 &&
        <p className="shrink-0 text-xs text-muted">
            Est. material cost <span className="font-semibold tabular-nums text-ink">{formatMoney(estimate)}</span>
          </p>
        }
      </div>

      {error ?
      <div className="flex items-center justify-between rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
          Could not load materials. <button type="button" className="font-medium underline" onClick={reload}>Try again</button>
        </div> :

      <div className="rounded-lg border border-line">
          {value.length > 0 &&
        <div className="hidden grid-cols-[minmax(0,2fr)_160px_minmax(0,1.4fr)_110px_36px] gap-3 border-b border-line px-3 py-2 text-xs font-medium text-faint md:grid">
              <span>Material</span>
              <span>Quantity used</span>
              <span>Note</span>
              <span className="text-right">Cost</span>
              <span />
            </div>
        }
          <ul className="divide-y divide-line">
            {value.map((d, idx) => {
            const r = resources.find((x) => x.id === d.resource_id);
            const qty = toNumber(d.quantity_used);
            const over = !!r && qty > toNumber(r.current_stock_quantity);
            return (
              <li key={d.key} className="grid gap-3 px-3 py-3 md:grid-cols-[minmax(0,2fr)_160px_minmax(0,1.4fr)_110px_36px] md:items-start">
                  <div>
                    <label htmlFor={`ru-res-${d.key}`} className="sr-only">Material {idx + 1}</label>
                    <select
                    id={`ru-res-${d.key}`}
                    className={inputClass}
                    value={d.resource_id ?? ''}
                    disabled={loading}
                    onChange={(e) => update(d.key, { resource_id: e.target.value ? Number(e.target.value) : null })}>
                    
                      <option value="">{loading ? 'Loading materials…' : 'Select material'}</option>
                      <optgroup label="Fabrics (kg)">
                        {resources.filter((x) => x.resource_type === 'FABRIC').map((x) =>
                      <option key={x.id} value={x.id}>{x.name}</option>
                      )}
                      </optgroup>
                      <optgroup label="Other resources">
                        {resources.filter((x) => x.resource_type === 'OTHER').map((x) =>
                      <option key={x.id} value={x.id}>{x.name} ({x.unit_of_measurement})</option>
                      )}
                      </optgroup>
                    </select>
                    {r && <p className="mt-1 text-[11px] text-faint">{formatQty(r.current_stock_quantity, r.unit_of_measurement)} in stock · {formatMoney(r.unit_cost)}/{r.unit_of_measurement}</p>}
                  </div>
                  <div>
                    <label htmlFor={`ru-qty-${d.key}`} className="sr-only">Quantity used</label>
                    <div className="relative">
                      <input
                      id={`ru-qty-${d.key}`}
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0"
                      className={cx(inputClass, 'pr-16', over && 'border-warn')}
                      value={d.quantity_used}
                      onChange={(e) => update(d.key, { quantity_used: e.target.value })} />
                    
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-faint">{r?.unit_of_measurement ?? 'unit'}</span>
                    </div>
                    {over && <p className="mt-1 text-[11px] text-warn">More than in stock</p>}
                  </div>
                  <div>
                    <label htmlFor={`ru-note-${d.key}`} className="sr-only">Note</label>
                    <input id={`ru-note-${d.key}`} className={inputClass} placeholder="Optional" value={d.notes} onChange={(e) => update(d.key, { notes: e.target.value })} />
                  </div>
                  <p className="self-center text-right text-sm tabular-nums text-muted">{r && qty > 0 ? formatMoney(qty * toNumber(r.unit_cost)) : '—'}</p>
                  <Button variant="ghost" size="sm" icon={Trash2Icon} onClick={() => remove(d.key)} aria-label={`Remove material ${idx + 1}`} className="self-center" />
                </li>);

          })}
          </ul>
          <div className={cx('px-3 py-2', value.length > 0 && 'border-t border-line')}>
            <Button variant="ghost" size="sm" icon={PlusIcon} onClick={() => onChange([...value, newDraftResource()])}>
              Add material
            </Button>
          </div>
        </div>
      }
    </section>);

}