import React, { useEffect, useState } from 'react';
import type { OrderStatus } from '../../types/api';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { useAuth } from '../../contexts/AuthContext';
import { ORDER_PIPELINE, canSetStatus, nextStatus } from '../../data/workflow';
import { humanize } from '../../utils/format';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { inputClass } from '../../utils/styles';

interface StatusUpdateModalProps {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  orderId: number;
  current: OrderStatus;
  initial?: OrderStatus | null;
}

export function StatusUpdateModal({ open, onClose, onDone, orderId, current, initial }: StatusUpdateModalProps) {
  const { role } = useAuth();
  const allowed = ORDER_PIPELINE.filter((s) => s !== current && canSetStatus(role, s));
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [notes, setNotes] = useState('');
  const { run, pending } = useAction();

  useEffect(() => {
    if (!open) return;
    const next = initial ?? nextStatus(current);
    setStatus(next && allowed.includes(next) ? next : allowed[0] ?? '');
    setNotes('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, current, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return;
    const res = await run(() => api.post(`/api/orders/orders/${orderId}/update-status/`, { status, notes }), `Order moved to ${humanize(status)}`);
    if (res !== undefined) onDone();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update order status"
      description={`Currently ${humanize(current)}. Every change is written to the audit log.`}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="status-form" loading={pending} disabled={!status}>
            Update status
          </Button>
        </>
      }>
      
      {allowed.length === 0 ?
      <p className="text-sm text-muted">Your role can't move this order to another stage. The responsible department will progress it.</p> :

      <form id="status-form" onSubmit={submit} className="space-y-4">
          <Field label="New status" htmlFor="st-status" hint="Only stages your department is responsible for are listed.">
            <select id="st-status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
              {allowed.map((s) =>
            <option key={s} value={s}>{humanize(s)}</option>
            )}
            </select>
          </Field>
          <Field label="Notes" htmlFor="st-notes">
            <textarea id="st-notes" rows={3} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </form>
      }
    </Modal>);

}