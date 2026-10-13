import React, { useEffect, useState } from 'react';
import type { ProductionStage, WipItem } from '../../types/api';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { useAction } from '../../hooks/useAction';
import { useBrands } from '../../contexts/BrandContext';
import { formatNumber } from '../../utils/format';
import { stageLabel, stagesBefore } from '../../utils/production';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { cx, inputClass } from '../../utils/styles';

interface AddWipToStageModalProps {
  stage: ProductionStage | null;
  orderCode?: string | null;
  brandId?: number | null;
  brandName?: string | null;
  onClose: () => void;
  onDone: () => void;
}

export function AddWipToStageModal({ stage, orderCode, brandId, brandName, onClose, onDone }: AddWipToStageModalProps) {
  const { brands } = useBrands();
  const [qtys, setQtys] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState('');
  const { run, pending } = useAction();

  const resolvedBrand = brandId ?? brands.find((b) => b.name === brandName)?.id ?? null;
  const earlier = stage ? stagesBefore(stage.stage_name) : [];
  const name = stage ? stage.stage_name_display ?? stageLabel(stage.stage_name) : '';

  const { data, loading, error, reload } = useApi(
    () => stage && resolvedBrand ? api.list<WipItem>('/api/inventory/wip/', { brand: resolvedBrand }) : Promise.resolve(null),
    [stage?.id, resolvedBrand]
  );

  useEffect(() => {
    if (!stage) return;
    setQtys({});
    setNotes('');
  }, [stage]);

  const eligible = (data ?? []).filter((w) => w.available_quantity > 0 && earlier.includes(w.stage_completed) && (!resolvedBrand || w.brand === resolvedBrand));
  const sameOrder = eligible.filter((w) => !!orderCode && w.source_order_code === orderCode);
  const others = eligible.filter((w) => !orderCode || w.source_order_code !== orderCode);

  const picks = eligible.
  map((w) => ({ item: w, qty: Math.floor(Number(qtys[w.id] || 0)) })).
  filter((p) => p.qty > 0);
  const total = picks.reduce((s, p) => s + p.qty, 0);
  const valid = !!stage?.id && picks.length > 0 && picks.every((p) => p.qty <= p.item.available_quantity);

  const setQty = (item: WipItem, raw: string) => {
    const n = Math.max(0, Math.min(item.available_quantity, Math.floor(Number(raw || 0))));
    setQtys((prev) => ({ ...prev, [item.id]: raw === '' ? '' : String(n) }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stage?.id || !valid) return;
    const res = await run(async () => {
      for (const p of picks) {
        await api.post(`/api/production/production-stages/${stage.id}/add-wip/`, {
          wip_item_id: p.item.id,
          quantity: p.qty,
          notes: (notes.trim() || `Added ${p.qty} ${stageLabel(p.item.stage_completed).toLowerCase()} pieces to ${name}${orderCode ? ` on ${orderCode}` : ''}`).slice(0, 255)
        });
      }
      return true;
    }, `${formatNumber(total)} semi-finished units added to ${name}`);
    if (res !== undefined) onDone();
  };

  const renderRows = (rows: WipItem[]) =>
  <ul className="divide-y divide-line">
      {rows.map((w) => {
      const id = `aw-qty-${w.id}`;
      const qty = qtys[w.id] ?? '';
      return (
        <li key={w.id} className={cx('flex items-center gap-3 px-3 py-2', Number(qty) > 0 && 'bg-accent/5')}>
            <div className="min-w-0 flex-1">
              <label htmlFor={id} className="block truncate text-sm font-medium text-ink">{w.product_name}</label>
              <p className="truncate text-xs text-muted">
                {w.colour} · {w.size}{w.fabric_gsm ? ` · ${w.fabric_gsm}` : ''} · finished {stageLabel(w.stage_completed)}
                {w.source_order_code && w.source_order_code !== orderCode ? <span className="text-faint"> · from {w.source_order_code}</span> : null}
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
    </ul>;


  return (
    <Modal
      open={!!stage}
      onClose={onClose}
      size="lg"
      title={`Add stored stock to ${name}`}
      description={
      stage ?
      `Semi-finished units enter ${name} directly${orderCode ? ` on ${orderCode}` : ''}. The step's input and target go up by the amount added. Currently ${formatNumber(stage.target_quantity ?? 0)} needed.` :
      undefined
      }
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="add-wip-form" loading={pending} disabled={!valid}>
            {total > 0 ? `Add ${formatNumber(total)} to ${name}` : `Add to ${name}`}
          </Button>
        </>
      }>
      
      <form id="add-wip-form" onSubmit={submit} className="space-y-4">
        {earlier.length === 0 ?
        <p className="rounded-lg bg-canvas px-3 py-3 text-xs text-muted">{name} is the first step — there's no earlier semi-finished stock to add.</p> :
        !resolvedBrand ?
        <p className="rounded-lg bg-canvas px-3 py-3 text-xs text-muted">Brand not found for this job.</p> :
        loading && !data ?
        <p className="rounded-lg bg-canvas px-3 py-3 text-xs text-muted">Loading stored stock…</p> :
        error ?
        <p className="rounded-lg bg-danger-soft px-3 py-3 text-xs text-danger">
            Couldn't load stored stock. <button type="button" className="font-medium underline" onClick={reload}>Retry</button>
          </p> :
        eligible.length === 0 ?
        <p className="rounded-lg bg-warn-soft/60 px-3 py-3 text-xs text-warn">
            No stored stock finished at {earlier.map(stageLabel).join(', ')} for this brand.
          </p> :

        <div className="space-y-3">
            {sameOrder.length > 0 &&
          <section className="overflow-hidden rounded-lg border border-accent/40" aria-labelledby="aw-same">
                <div className="border-b border-accent/30 bg-accent/5 px-3 py-2">
                  <p id="aw-same" className="text-xs font-semibold text-ink">Surplus from this order</p>
                  <p className="text-[11px] text-muted">Extra units {orderCode} stored at an earlier step — put them back into the line here.</p>
                </div>
                {renderRows(sameOrder)}
              </section>
          }
            {others.length > 0 &&
          <section className="overflow-hidden rounded-lg border border-line" aria-labelledby="aw-other">
                <div className="border-b border-line px-3 py-2">
                  <p id="aw-other" className="text-xs font-semibold text-ink">{sameOrder.length > 0 ? 'Other stored stock' : 'Stored stock for this brand'}</p>
                  <p className="text-[11px] text-muted">Semi-finished units left over from other orders of the same brand.</p>
                </div>
                {renderRows(others)}
              </section>
          }
          </div>
        }

        {total > 0 && stage &&
        <dl className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg bg-canvas px-3 py-2 text-sm">
            <div className="flex gap-1.5">
              <dt className="text-muted">Adding</dt>
              <dd className="font-semibold tabular-nums">{formatNumber(total)}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-muted">New target for {name}</dt>
              <dd className="font-semibold tabular-nums">{formatNumber((stage.target_quantity ?? 0) + total)}</dd>
            </div>
          </dl>
        }

        <Field label="Notes" htmlFor="aw-notes">
          <textarea id="aw-notes" rows={2} maxLength={255} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Modal>);

}