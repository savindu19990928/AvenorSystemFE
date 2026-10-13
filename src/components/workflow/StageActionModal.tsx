import React, { useEffect, useState } from 'react';
import type { ProductionStage } from '../../types/api';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { useAuth } from '../../contexts/AuthContext';
import { formatNumber } from '../../utils/format';
import { semiFinishedCount, stageLabel } from '../../utils/production';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { cx, inputClass } from '../../utils/styles';

interface StageActionModalProps {
  stage: ProductionStage | null;
  /** The step that receives this step's output. Null when this is the last step. */
  next?: ProductionStage | null;
  mode: 'start' | 'complete';
  onClose: () => void;
  onDone: () => void;
}

export function StageActionModal({ stage, next = null, mode, onClose, onDone }: StageActionModalProps) {
  const { user } = useAuth();
  const [completed, setCompleted] = useState('');
  const [extra, setExtra] = useState('0');
  const [damaged, setDamaged] = useState('0');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const { run, pending } = useAction();

  useEffect(() => {
    if (!stage) return;
    setCompleted(String(stage.target_quantity ?? ''));
    setExtra('0');
    setDamaged('0');
    setReason('');
    setNotes('');
  }, [stage]);

  const name = stage ? stage.stage_name_display ?? stageLabel(stage.stage_name) : '';
  const nextName = next ? next.stage_name_display ?? stageLabel(next.stage_name) : null;

  const toInt = (v: string) => Math.max(0, Math.floor(Number(v || 0)));
  const good = toInt(completed);
  const extraN = toInt(extra);
  const damagedN = toInt(damaged);
  const semiFinished = semiFinishedCount(extraN, damagedN);
  const damageBeyondExtra = Math.max(0, damagedN - extraN);
  const needsReason = damagedN > 0;
  const target = stage?.target_quantity ?? 0;
  const shortfall = target > 0 ? Math.max(0, target - good) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stage?.id) return;
    const res =
    mode === 'start' ?
    await run(() => api.post(`/api/production/production-stages/${stage.id}/start/`, { staff_id: user?.id, notes }), `${name} started`) :
    await run(
      () =>
      api.post(`/api/production/production-stages/${stage.id}/complete/`, {
        completed_quantity: good,
        extra_pieces: extraN,
        damaged_quantity: damagedN,
        damaged_reason: reason,
        quantity_to_inventory: semiFinished,
        quantity_to_next_stage: good,
        notes
      }),
      semiFinished > 0 ? `${name} completed · ${formatNumber(semiFinished)} semi-finished stored` : `${name} completed`
    );
    if (res !== undefined) onDone();
  };

  return (
    <Modal
      open={!!stage}
      onClose={onClose}
      size={mode === 'complete' ? 'lg' : undefined}
      title={mode === 'start' ? `Start ${name}` : `Complete ${name}`}
      description={
      mode === 'start' ?
      stage?.stage_name === 'CUTTING' ?
      'Starting cutting issues the reserved blanks from the store and reduces stock.' :
      `Assigned to you (${user?.username ?? ''}).` :
      nextName ?
      `${formatNumber(target)} needed for this order. Order pieces move on to ${nextName}; net extras go to semi-finished stock.` :
      `${formatNumber(target)} needed. This is the last step — completing it marks the order ready for delivery.`
      }
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="stage-form" loading={pending} disabled={mode === 'complete' && (completed === '' || needsReason && !reason.trim())}>
            {mode === 'start' ? 'Start stage' : 'Record completion'}
          </Button>
        </>
      }>
      
      <form id="stage-form" onSubmit={submit} className="space-y-4">
        {mode === 'complete' &&
        <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Pieces for this order" htmlFor="sg-done" hint={target ? `${formatNumber(target)} needed` : undefined} required>
                <input id="sg-done" type="number" min={0} required className={inputClass} value={completed} onChange={(e) => setCompleted(e.target.value)} />
              </Field>
              <Field label="Extra pieces" htmlFor="sg-extra" hint="Made beyond what's needed">
                <input id="sg-extra" type="number" min={0} className={inputClass} value={extra} onChange={(e) => setExtra(e.target.value)} />
              </Field>
              <Field label="Damaged pieces" htmlFor="sg-dmg">
                <input id="sg-dmg" type="number" min={0} className={inputClass} value={damaged} onChange={(e) => setDamaged(e.target.value)} />
              </Field>
            </div>
            {needsReason &&
          <Field label="Damage reason" htmlFor="sg-reason" required>
                <input id="sg-reason" required className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
          }

            {(extraN > 0 || damagedN > 0) &&
          <section className="rounded-lg border border-line" aria-labelledby="sg-semi">
                <p id="sg-semi" className="border-b border-line px-3 py-2 text-xs font-semibold text-ink">Semi-finished stock from {name}</p>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-3 text-sm tabular-nums">
                  <span className="text-muted">{formatNumber(extraN)} extra</span>
                  <span className="text-faint" aria-hidden>−</span>
                  <span className="text-danger">{formatNumber(damagedN)} damaged</span>
                  <span className="text-faint" aria-hidden>=</span>
                  <span className={cx('text-lg font-semibold', semiFinished > 0 ? 'text-accent' : 'text-muted')}>
                    {formatNumber(semiFinished)} to inventory
                  </span>
                </div>
                {damageBeyondExtra > 0 &&
            <p className="border-t border-line bg-warn-soft/60 px-3 py-2 text-xs text-warn">
                    Damage exceeds extras by {formatNumber(damageBeyondExtra)} — nothing is stored. Make sure “Pieces for this order” counts good pieces only.
                  </p>
            }
              </section>
          }

            {shortfall > 0 && completed !== '' &&
          <p className="rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn">
                {formatNumber(shortfall)} short of the {formatNumber(target)} needed.
                {nextName ? ` ${nextName} will receive ${formatNumber(good)}.` : ''} Stored stock can top this up.
              </p>
          }

            {completed !== '' &&
          <dl className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg bg-canvas px-3 py-2 text-sm">
                <div className="flex gap-1.5">
                  <dt className="text-muted">{nextName ? `To ${nextName}` : 'To delivery'}</dt>
                  <dd className="font-semibold tabular-nums">{formatNumber(good)}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-muted">To inventory</dt>
                  <dd className="font-semibold tabular-nums">{formatNumber(semiFinished)}</dd>
                </div>
              </dl>
          }
          </>
        }
        <Field label="Notes" htmlFor="sg-notes">
          <textarea id="sg-notes" rows={2} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Modal>);

}