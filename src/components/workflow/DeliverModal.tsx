import React, { useEffect, useState } from 'react';
import type { Delivery } from '../../types/api';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { inputClass } from '../../utils/styles';

export function DeliverModal({ delivery, onClose, onDone }: {delivery: Delivery | null;onClose: () => void;onDone: () => void;}) {
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const { run, pending } = useAction();

  useEffect(() => {
    if (delivery) {
      setRecipient(delivery.customer_name ?? '');
      setNotes('');
    }
  }, [delivery]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery) return;
    const res = await run(() => api.post(`/api/delivery/deliveries/${delivery.id}/mark-delivered/`, { recipient_name: recipient, notes }), 'Delivery confirmed');
    if (res !== undefined) onDone();
  };

  return (
    <Modal
      open={!!delivery}
      onClose={onClose}
      title="Confirm delivery"
      description="Records proof of handover and moves the order to invoicing."
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="deliver-form" loading={pending} disabled={!recipient.trim()}>
            Mark delivered
          </Button>
        </>
      }>
      
      <form id="deliver-form" onSubmit={submit} className="space-y-4">
        <Field label="Received by" htmlFor="dv-rec" required>
          <input id="dv-rec" required className={inputClass} value={recipient} onChange={(e) => setRecipient(e.target.value)} />
        </Field>
        <Field label="Notes" htmlFor="dv-notes">
          <textarea id="dv-notes" rows={2} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Modal>);

}