import React, { useEffect, useState } from 'react';
import type { ProductionStage } from '../../types/api';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { useAuth } from '../../contexts/AuthContext';
import { humanize } from '../../utils/format';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { inputClass } from '../../utils/styles';

interface StageActionModalProps {
  stage: ProductionStage | null;
  mode: 'start' | 'complete';
  onClose: () => void;
  onDone: () => void;
}

export function StageActionModal({ stage, mode, onClose, onDone }: StageActionModalProps) {
  const { user } = useAuth();
  const [completed, setCompleted] = useState('');
  const [damaged, setDamaged] = useState('0');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const { run, pending } = useAction();

  useEffect(() => {
    if (!stage) return;
    setCompleted(String(stage.target_quantity ?? ''));
    setDamaged('0');
    setReason('');
    setNotes('');
  }, [stage]);

  const name = stage ? stage.stage_name_display ?? humanize(stage.stage_name) : '';
  const needsReason = Number(damaged) > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stage?.id) return;
    const res =
    mode === 'start' ?
    await run(() => api.post(`/api/production/production-stages/${stage.id}/start/`, { staff_id: user?.id, notes }), `${name} started`) :
    await run(
      () =>
      api.post(`/api/production/production-stages/${stage.id}/complete/`, {
        completed_quantity: Number(completed),
        damaged_quantity: Number(damaged || 0),
        damaged_reason: reason,
        notes
      }),
      `${name} completed`
    );
    if (res !== undefined) onDone();
  };

  return (
    <Modal
      open={!!stage}
      onClose={onClose}
      title={mode === 'start' ? `Start ${name}` : `Complete ${name}`}
      description={
      mode === 'start' ?
      stage?.stage_name === 'CUTTING' ?
      'Starting cutting issues the reserved blanks from the store and reduces stock.' :
      `Assigned to you (${user?.username ?? ''}).` :
      stage?.stage_name === 'PACKING' ?
      'Completing packing marks the order ready for delivery.' :
      `Target quantity ${stage?.target_quantity ?? '—'}`
      }
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="stage-form" loading={pending} disabled={mode === 'complete' && (!completed || needsReason && !reason.trim())}>
            {mode === 'start' ? 'Start stage' : 'Record completion'}
          </Button>
        </>
      }>
      
      <form id="stage-form" onSubmit={submit} className="space-y-4">
        {mode === 'complete' &&
        <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Completed quantity" htmlFor="sg-done" required>
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
          </>
        }
        <Field label="Notes" htmlFor="sg-notes">
          <textarea id="sg-notes" rows={2} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Modal>);

}