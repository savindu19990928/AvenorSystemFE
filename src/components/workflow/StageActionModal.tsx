import React, { useEffect, useState } from 'react';
import type { ProductionStage } from '../../types/api';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { useAuth } from '../../contexts/AuthContext';
import { formatNumber } from '../../utils/format';
import { stageLabel } from '../../utils/production';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { cx, inputClass } from '../../utils/styles';

type SurplusChoice = 'store' | 'forward' | 'split';

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
  const [damaged, setDamaged] = useState('0');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [choice, setChoice] = useState<SurplusChoice>('store');
  const [splitStore, setSplitStore] = useState('');
  const { run, pending } = useAction();

  useEffect(() => {
    if (!stage) return;
    setCompleted(String(stage.target_quantity ?? ''));
    setDamaged('0');
    setReason('');
    setNotes('');
    setChoice('store');
    setSplitStore('');
  }, [stage]);

  const name = stage ? stage.stage_name_display ?? stageLabel(stage.stage_name) : '';
  const nextName = next ? next.stage_name_display ?? stageLabel(next.stage_name) : null;
  const needsReason = Number(damaged) > 0;

  const good = Math.max(0, Math.floor(Number(completed || 0)));
  const target = stage?.target_quantity ?? 0;
  const surplus = target > 0 ? Math.max(0, good - target) : 0;
  const shortfall = target > 0 ? Math.max(0, target - good) : 0;
  const toStore = surplus === 0 ? 0 : choice === 'forward' ? 0 : choice === 'store' ? surplus : Math.min(surplus, Math.max(0, Math.floor(Number(splitStore || 0))));
  const toNext = good - toStore;

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
        damaged_quantity: Number(damaged || 0),
        damaged_reason: reason,
        quantity_to_inventory: toStore,
        quantity_to_next_stage: toNext,
        notes
      }),
      toStore > 0 ? `${name} completed · ${toStore} stored in inventory` : `${name} completed`
    );
    if (res !== undefined) onDone();
  };

  const options: {id: SurplusChoice;title: string;text: string;}[] = [
  {
    id: 'store',
    title: 'Store in inventory',
    text: `Kept as stock finished at ${name} — future orders can start from the next step.`
  },
  {
    id: 'forward',
    title: nextName ? `Send to ${nextName}` : 'Include in delivery',
    text: nextName ? `${nextName} works on all ${formatNumber(good)}.` : `All ${formatNumber(good)} go out with the order.`
  },
  { id: 'split', title: 'Split', text: 'Choose how many to store; the rest move on.' }];


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
      `${formatNumber(target)} needed for this order. Good output moves on to ${nextName}.` :
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Good units produced" htmlFor="sg-done" hint="Usable output, not counting damaged." required>
                <input id="sg-done" type="number" min={0} required className={inputClass} value={completed} onChange={(e) => setCompleted(e.target.value)} />
              </Field>
              <Field label="Damaged quantity" htmlFor="sg-dmg">
                <input id="sg-dmg" type="number" min={0} className={inputClass} value={damaged} onChange={(e) => setDamaged(e.target.value)} />
              </Field>
            </div>
            {needsReason &&
          <Field label="Damage reason" htmlFor="sg-reason" required>
                <input id="sg-reason" required className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
          }

            {surplus > 0 &&
          <fieldset className="rounded-lg border border-line p-3">
                <legend className="px-1 text-sm font-semibold text-ink">
                  {formatNumber(surplus)} extra beyond the {formatNumber(target)} needed
                </legend>
                <p className="text-xs text-muted">Decide where the extra units go.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {options.map((o) => {
                const on = choice === o.id;
                return (
                  <label
                    key={o.id}
                    className={cx(
                      'flex cursor-pointer flex-col rounded-lg border p-3 transition-colors duration-150 ease-out focus-within:ring-2 focus-within:ring-accent/40',
                      on ? 'border-accent bg-accent/5' : 'border-line hover:border-line-strong'
                    )}>
                    
                        <span className="flex items-center gap-2">
                          <input type="radio" name="surplus" value={o.id} checked={on} onChange={() => setChoice(o.id)} className="h-3.5 w-3.5 accent-[#1f6f5c]" />
                          <span className="text-sm font-medium text-ink">{o.title}</span>
                        </span>
                        <span className="mt-1 text-xs leading-snug text-muted">{o.text}</span>
                      </label>);

              })}
                </div>
                {choice === 'split' &&
            <Field label="Units to store" htmlFor="sg-split" hint={`Up to ${formatNumber(surplus)}`} className="mt-3 max-w-[200px]">
                    <input id="sg-split" type="number" min={0} max={surplus} className={inputClass} value={splitStore} onChange={(e) => setSplitStore(e.target.value)} />
                  </Field>
            }
              </fieldset>
          }

            {shortfall > 0 && completed !== '' &&
          <p className="rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn">
                {formatNumber(shortfall)} short of the {formatNumber(target)} needed.
                {nextName ? ` ${nextName} will receive ${formatNumber(good)}.` : ''} Stored stock can top this up from Inventory.
              </p>
          }

            {completed !== '' &&
          <dl className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg bg-canvas px-3 py-2 text-sm">
                <div className="flex gap-1.5">
                  <dt className="text-muted">{nextName ? `To ${nextName}` : 'To delivery'}</dt>
                  <dd className="font-semibold tabular-nums">{formatNumber(toNext)}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-muted">To inventory</dt>
                  <dd className="font-semibold tabular-nums">{formatNumber(toStore)}</dd>
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