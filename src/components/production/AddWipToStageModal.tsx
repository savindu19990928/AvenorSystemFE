import React, { useState } from 'react';
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
import { AlertTriangleIcon, CheckCircle2Icon, LayersIcon, SparklesIcon } from 'lucide-react';

interface AddWipToStageModalProps {
  stage: ProductionStage | null;
  stages?: ProductionStage[] | null;
  orderCode?: string | null;
  brandId?: number | null;
  brandName?: string | null;
  onClose: () => void;
  onDone: () => void;
}

function AddWipToStageModalContent({
  stage,
  stages = null,
  orderCode,
  brandId,
  brandName,
  onClose,
  onDone
}: AddWipToStageModalProps & { stage: ProductionStage }) {
  const { brands } = useBrands();
  const [qtys, setQtys] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState('');
  const { run, pending } = useAction();

  const resolvedBrand = brandId ?? brands.find((b) => b.name === brandName)?.id ?? null;
  const earlier = stagesBefore(stage.stage_name);
  const name = stage.stage_name_display ?? stageLabel(stage.stage_name);

  // Identify preceding stage to inspect damage and balancing deficits
  const activeStages = [...(stages ?? [])]
    .filter((s) => s.status !== 'SKIPPED')
    .sort((a, b) => (a.sequence_order ?? 0) - (b.sequence_order ?? 0));
  const stageIdx = activeStages.findIndex((s) => s.id === stage.id || s.stage_name === stage.stage_name);
  const prevStage = stageIdx > 0 ? activeStages[stageIdx - 1] : null;

  const prevDamaged = prevStage?.damaged_quantity ?? 0;
  const prevExtra = prevStage?.extra_pieces ?? prevStage?.extra_quantity ?? 0;
  const hasPrecedingDeficit = Boolean(
    prevStage &&
    prevStage.status === 'COMPLETED' &&
    prevDamaged > prevExtra
  );
  const damageBeyondExtra = hasPrecedingDeficit ? prevDamaged - prevExtra : 0;

  // Calculate missing items count limit per API Documentation Section 10 & 11:
  // missing_quantity = order_needed_quantity - input_quantity
  const orderNeeded = prevStage?.target_quantity ?? stage.target_quantity ?? 0;
  const currentInput = stage.input_quantity ?? (prevStage?.quantity_to_next_stage ?? Math.max(0, orderNeeded - damageBeyondExtra));
  const computedMissing = Math.max(0, orderNeeded - currentInput);

  const isDeficitRestricted = hasPrecedingDeficit || (stage.missing_quantity !== undefined && stage.missing_quantity !== null);
  const missingLimit = stage.missing_quantity !== undefined && stage.missing_quantity !== null
    ? stage.missing_quantity
    : isDeficitRestricted
    ? computedMissing
    : null;

  const isFulfilled = isDeficitRestricted && missingLimit === 0;

  const { data, loading, error, reload } = useApi(
    () => resolvedBrand ? api.list<WipItem>('/api/inventory/wip/', { brand: resolvedBrand }) : Promise.resolve(null),
    [stage.id, resolvedBrand]
  );

  const eligible = (data ?? []).filter(
    (w) => w.available_quantity > 0 && earlier.includes(w.stage_completed) && (!resolvedBrand || w.brand === resolvedBrand)
  );
  const sameOrder = eligible.filter((w) => !!orderCode && w.source_order_code === orderCode);
  const others = eligible.filter((w) => !orderCode || w.source_order_code !== orderCode);

  const picks = eligible
    .map((w) => ({ item: w, qty: Math.floor(Number(qtys[w.id] || 0)) }))
    .filter((p) => p.qty > 0);

  const total = picks.reduce((s, p) => s + p.qty, 0);

  const exceedsMissing = isDeficitRestricted && missingLimit !== null && total > missingLimit;
  const valid =
    !!stage.id &&
    picks.length > 0 &&
    !isFulfilled &&
    !exceedsMissing &&
    picks.every((p) => p.qty <= p.item.available_quantity);

  const setQty = (item: WipItem, raw: string) => {
    const parsed = Math.floor(Number(raw || 0));
    const n = Math.max(0, Math.min(item.available_quantity, parsed));
    setQtys((prev) => ({ ...prev, [item.id]: raw === '' ? '' : String(n) }));
  };

  /**
   * Auto-fill helper to conveniently allocate up to the missing items count
   * from available stocks, prioritizing same-order semi-finished units first.
   */
  const autoFillMissing = () => {
    if (missingLimit === null || missingLimit <= 0) return;
    let needed = missingLimit;
    const newQtys: Record<number, string> = {};

    // Prioritize same order stock first, then others
    const orderedCandidates = [...sameOrder, ...others];
    for (const item of orderedCandidates) {
      if (needed <= 0) break;
      const take = Math.min(item.available_quantity, needed);
      if (take > 0) {
        newQtys[item.id] = String(take);
        needed -= take;
      }
    }
    setQtys(newQtys);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stage.id || !valid) return;

    const res = await run(async () => {
      // Per API Documentation 9:
      // Supports single stock or multiple stocks via the `items` array.
      if (picks.length > 1) {
        return api.post(`/api/production/production-stages/${stage.id}/add-wip/`, {
          items: picks.map((p) => ({
            wip_item_id: p.item.id,
            quantity: p.qty,
            notes: (notes.trim() || `Injection of ${p.qty} ${stageLabel(p.item.stage_completed)} blanks to fulfill deficit`).slice(0, 255)
          })),
          notes: (notes.trim() || `Bringing ${total} missing pieces from ${picks.length} semi-finished stocks into ${name}`).slice(0, 255)
        });
      } else {
        const single = picks[0];
        return api.post(`/api/production/production-stages/${stage.id}/add-wip/`, {
          wip_item_id: single.item.id,
          quantity: single.qty,
          items: [{ wip_item_id: single.item.id, quantity: single.qty }],
          notes: (notes.trim() || `Added ${single.qty} ${stageLabel(single.item.stage_completed).toLowerCase()} pieces to ${name}${orderCode ? ` on ${orderCode}` : ''}`).slice(0, 255)
        });
      }
    }, `${formatNumber(total)} semi-finished units added from ${picks.length} stock${picks.length === 1 ? '' : 's'} to ${name}`);

    if (res !== undefined) onDone();
  };

  const renderRows = (rows: WipItem[]) => (
    <ul className="divide-y divide-line">
      {rows.map((w) => {
        const id = `aw-qty-${w.id}`;
        const qty = qtys[w.id] ?? '';
        const autoId = w.stock_id || w.wip_id;
        const colourText = w.colours && w.colours.length ? w.colours.join(', ') : w.colour;
        const sizeText = w.sizes && w.sizes.length ? w.sizes.join(', ') : w.size;

        return (
          <li key={w.id} className={cx('flex items-center gap-3 px-3 py-2.5', Number(qty) > 0 && 'bg-accent/5')}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {autoId && (
                  <span className="rounded bg-accent/10 px-1.5 py-0.2 font-mono text-[11px] font-semibold text-accent">
                    {autoId}
                  </span>
                )}
                <label htmlFor={id} className="block truncate text-sm font-medium text-ink">
                  {w.product_name}
                </label>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted">
                {colourText ? <span className="font-medium text-ink">{colourText}</span> : 'Any colour'}
                {' · '}
                {sizeText ? <span>{sizeText}</span> : 'Any size'}
                {w.fabric_gsm ? ` · ${w.fabric_gsm}` : ''}
                {w.printing_method ? ` · ${w.printing_method}` : ''}
                {' · '}
                finished {stageLabel(w.stage_completed)}
                {w.source_order_code && w.source_order_code !== orderCode ? (
                  <span className="text-faint"> · from {w.source_order_code}</span>
                ) : null}
              </p>
            </div>
            <span className="whitespace-nowrap text-xs tabular-nums text-muted">
              {formatNumber(w.available_quantity)} available
            </span>
            <input
              id={id}
              type="number"
              min={0}
              max={w.available_quantity}
              disabled={isFulfilled}
              placeholder="0"
              className={cx(inputClass, 'w-20 py-1.5 text-right tabular-nums')}
              value={qty}
              onChange={(e) => setQty(w, e.target.value)}
            />
          </li>
        );
      })}
    </ul>
  );

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`Add stored semi-finished stock to ${name}`}
      description={`Inject stored semi-finished blanks into ${name} directly${orderCode ? ` for order ${orderCode}` : ''}. You can allocate from single or multiple semi-finished stocks.`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            type="submit"
            form="add-wip-form"
            loading={pending}
            disabled={!valid}
          >
            {total > 0
              ? `Add ${formatNumber(total)} from ${picks.length} stock${picks.length === 1 ? '' : 's'}`
              : `Add to ${name}`}
          </Button>
        </>
      }
    >
      <form id="add-wip-form" onSubmit={submit} className="space-y-4">
        {/* Deficit / Shortfall Notice & Balancing Rules */}
        {isDeficitRestricted && (
          <div
            className={cx(
              'rounded-lg border p-3 text-xs',
              isFulfilled
                ? 'border-ok/30 bg-ok-soft/30 text-ink'
                : 'border-warn/40 bg-warn-soft/40 text-ink'
            )}
          >
            <div className="flex items-start gap-2">
              {isFulfilled ? (
                <CheckCircle2Icon className="h-4 w-4 shrink-0 text-ok mt-0.5" />
              ) : (
                <AlertTriangleIcon className="h-4 w-4 shrink-0 text-warn mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">
                    {isFulfilled ? 'Deficit Shortfall Fulfilled' : 'Deficit & Missing Items Restriction'}
                  </p>
                  {prevStage && (
                    <span className="font-mono text-[11px] text-faint">
                      Preceding {stageLabel(prevStage.stage_name)}: {prevDamaged} damaged &gt; {prevExtra} extra
                    </span>
                  )}
                </div>

                {isFulfilled ? (
                  <p className="text-muted">
                    The missing items count for this stage has already been completely fulfilled ({formatNumber(orderNeeded)} units reached). Under the factory stock balancing policy, no additional units can be brought to this stage.
                  </p>
                ) : (
                  <>
                    <p className="text-muted">
                      Because damaged items were greater than extra pieces in {stageLabel(prevStage?.stage_name || 'earlier step')}, only the missing items count can be brought to this stage:
                      {' '}
                      <strong className="text-ink">
                        {formatNumber(missingLimit ?? 0)} missing item{missingLimit === 1 ? '' : 's'} allowed
                      </strong>.
                    </p>
                    {missingLimit !== null && missingLimit > 0 && total === 0 && (
                      <div className="pt-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          icon={SparklesIcon}
                          className="h-7 text-xs text-accent hover:text-accent-hover"
                          onClick={autoFillMissing}
                        >
                          Auto-fill missing {formatNumber(missingLimit)} items from available stock
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content list */}
        {earlier.length === 0 ? (
          <p className="rounded-lg bg-canvas px-3 py-3 text-xs text-muted">
            {name} is the first step — there is no earlier semi-finished stock to add.
          </p>
        ) : !resolvedBrand ? (
          <p className="rounded-lg bg-canvas px-3 py-3 text-xs text-muted">Brand not found for this job.</p>
        ) : loading && !data ? (
          <p className="rounded-lg bg-canvas px-3 py-3 text-xs text-muted">Loading stored stock…</p>
        ) : error ? (
          <p className="rounded-lg bg-danger-soft px-3 py-3 text-xs text-danger">
            Couldn't load stored stock.{' '}
            <button type="button" className="font-medium underline" onClick={reload}>
              Retry
            </button>
          </p>
        ) : eligible.length === 0 ? (
          <p className="rounded-lg bg-warn-soft/60 px-3 py-3 text-xs text-warn">
            No stored stock finished at {earlier.map(stageLabel).join(', ')} for this brand.
          </p>
        ) : (
          <div className="space-y-3">
            {sameOrder.length > 0 && (
              <section className="overflow-hidden rounded-lg border border-accent/40" aria-labelledby="aw-same">
                <div className="border-b border-accent/30 bg-accent/5 px-3 py-2 flex items-center justify-between">
                  <div>
                    <p id="aw-same" className="text-xs font-semibold text-ink">
                      Surplus from this order ({orderCode})
                    </p>
                    <p className="text-[11px] text-muted">
                      Extra units stored at an earlier step — inject them back into the line here.
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-accent">Same order stock</span>
                </div>
                {renderRows(sameOrder)}
              </section>
            )}

            {others.length > 0 && (
              <section className="overflow-hidden rounded-lg border border-line" aria-labelledby="aw-other">
                <div className="border-b border-line px-3 py-2 flex items-center justify-between">
                  <div>
                    <p id="aw-other" className="text-xs font-semibold text-ink">
                      {sameOrder.length > 0 ? 'Other stored stocks' : 'Stored stock for this brand'}
                    </p>
                    <p className="text-[11px] text-muted">
                      Semi-finished units from other orders of the same brand.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-muted flex items-center gap-1">
                    <LayersIcon className="h-3 w-3" /> Multi-stock available
                  </span>
                </div>
                {renderRows(others)}
              </section>
            )}
          </div>
        )}

        {/* Real-time Balancing & Quota Calculator */}
        {total > 0 && (
          <div className="space-y-2">
            <dl className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg bg-canvas px-3 py-2 text-sm">
              <div className="flex gap-1.5">
                <dt className="text-muted">Total adding</dt>
                <dd className="font-semibold tabular-nums text-ink">{formatNumber(total)}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-muted">Stocks selected</dt>
                <dd className="font-semibold tabular-nums text-ink">{picks.length}</dd>
              </div>
              {isDeficitRestricted && missingLimit !== null && (
                <div className="flex gap-1.5">
                  <dt className="text-muted">Allowed missing count</dt>
                  <dd
                    className={cx(
                      'font-semibold tabular-nums',
                      exceedsMissing ? 'text-danger' : 'text-ok'
                    )}
                  >
                    {formatNumber(missingLimit)}
                  </dd>
                </div>
              )}
              <div className="flex gap-1.5">
                <dt className="text-muted">New stage input</dt>
                <dd className="font-semibold tabular-nums text-accent">
                  {formatNumber(currentInput + total)}
                </dd>
              </div>
            </dl>

            {exceedsMissing && (
              <p className="rounded bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
                Exceeds allowed missing count: You selected {formatNumber(total)} units, but only {formatNumber(missingLimit ?? 0)} missing items can be brought to this stage. Please reduce selection by {formatNumber(total - (missingLimit ?? 0))}.
              </p>
            )}
          </div>
        )}

        <Field label="Operational Notes & Audit" htmlFor="aw-notes">
          <textarea
            id="aw-notes"
            rows={2}
            maxLength={255}
            className={inputClass}
            placeholder="e.g. Direct injection of missing cut blanks from multiple stocks to fulfill deficit"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}

export function AddWipToStageModal(props: AddWipToStageModalProps) {
  if (!props.stage) return null;
  return <AddWipToStageModalContent key={props.stage.id} {...props} stage={props.stage} />;
}