import React from 'react';
import type { WipItem } from '../../types/api';
import type { ProcessConfig, WipAllocations } from '../../types/production';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { formatNumber } from '../../utils/format';
import { stageBefore, stageLabel } from '../../utils/production';
import { cx, inputClass } from '../../utils/styles';

interface WipAllocationPickerProps {
  brandId: number | null | undefined;
  config: ProcessConfig;
  value: WipAllocations;
  onChange: (value: WipAllocations) => void;
}

export function WipAllocationPicker({ brandId, config, value, onChange }: WipAllocationPickerProps) {
  const prev = stageBefore(config);
  const { data, loading, error, reload } = useApi(
    () => prev && brandId ? api.list<WipItem>('/api/inventory/wip/', { brand: brandId, stage_completed: prev }) : Promise.resolve(null),
    [brandId, prev]
  );

  if (!prev) return null;

  const rows = (data ?? []).filter((w) => w.stage_completed === prev && w.available_quantity > 0);
  const picked = Object.values(value).reduce((s, q) => s + Number(q || 0), 0);

  const setQty = (item: WipItem, raw: string) => {
    const n = Math.max(0, Math.min(item.available_quantity, Math.floor(Number(raw || 0))));
    onChange({ ...value, [item.id]: raw === '' ? '' : String(n) });
  };

  return (
    <section className="rounded-lg border border-line" aria-labelledby="wip-pick-title">
      <div className="flex items-start justify-between gap-3 border-b border-line px-3 py-2">
        <div>
          <p id="wip-pick-title" className="text-xs font-medium text-ink">Stored stock finished at {stageLabel(prev)}</p>
          <p className="text-[11px] text-muted">Starting at {stageLabel(config.startFrom)} — pick how many stored units this order uses.</p>
        </div>
        {picked > 0 && <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-ink">{formatNumber(picked)} picked</span>}
      </div>
      {!brandId ?
      <p className="px-3 py-3 text-xs text-muted">Select a brand to see stored stock.</p> :
      loading ?
      <p className="px-3 py-3 text-xs text-muted">Loading stored stock…</p> :
      error ?
      <p className="px-3 py-3 text-xs text-danger">
          Couldn't load stored stock. <button type="button" className="font-medium underline" onClick={reload}>Retry</button>
        </p> :
      rows.length === 0 ?
      <p className="bg-warn-soft/50 px-3 py-3 text-xs text-warn">
          No stored stock has finished {stageLabel(prev)} for this brand. Start from an earlier step, or produce it later.
        </p> :

      <ul className="divide-y divide-line">
          {rows.map((w) => {
          const id = `wip-qty-${w.id}`;
          const qty = value[w.id] ?? '';
          return (
            <li key={w.id} className={cx('flex items-center gap-3 px-3 py-2', Number(qty) > 0 && 'bg-accent/5')}>
                <div className="min-w-0 flex-1">
                  <label htmlFor={id} className="block truncate text-sm font-medium text-ink">{w.product_name}</label>
                  <p className="truncate text-xs text-muted">
                    {w.colour} · {w.size}{w.fabric_gsm ? ` · ${w.fabric_gsm}` : ''} <span className="font-mono text-faint">· {w.sku}</span>
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs tabular-nums text-muted">{formatNumber(w.available_quantity)} available</span>
                <input
                id={id}
                type="number"
                min={0}
                max={w.available_quantity}
                placeholder="0"
                className={cx(inputClass, 'w-20 py-1.5 text-right tabular-nums')}
                value={qty}
                onChange={(e) => setQty(w, e.target.value)} />
              
              </li>);

        })}
        </ul>
      }
    </section>);

}