import React, { useEffect, useState } from 'react';
import type { Delivery } from '../../types/api';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { todayISO } from '../../utils/format';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { inputClass } from '../../utils/styles';

export function DispatchModal({ delivery, onClose, onDone }: {delivery: Delivery | null;onClose: () => void;onDone: () => void;}) {
  const [courier, setCourier] = useState('');
  const [tracking, setTracking] = useState('');
  const [eta, setEta] = useState(todayISO(1));
  const [notes, setNotes] = useState('');
  const { run, pending } = useAction();

  useEffect(() => {
    if (!delivery) return;
    setCourier(delivery.courier_name ?? '');
    setTracking(delivery.tracking_number ?? '');
    setEta(todayISO(1));
    setNotes('');
  }, [delivery]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery) return;
    const res = await run(
      () => api.post(`/api/delivery/deliveries/${delivery.id}/dispatch/`, { courier_name: courier, tracking_number: tracking, estimated_delivery_date: eta, delivery_notes: notes }),
      `${delivery.delivery_number} dispatched`
    );
    if (res !== undefined) onDone();
  };

  return (
    <Modal
      open={!!delivery}
      onClose={onClose}
      title="Dispatch with courier"
      description={delivery ? `${delivery.delivery_number} · ${delivery.order_code}` : undefined}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="dispatch-form" loading={pending} disabled={!courier.trim()}>
            Dispatch
          </Button>
        </>
      }>
      
      <form id="dispatch-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Courier" htmlFor="dp-courier" required>
            <input id="dp-courier" required className={inputClass} value={courier} onChange={(e) => setCourier(e.target.value)} />
          </Field>
          <Field label="Tracking number" htmlFor="dp-track">
            <input id="dp-track" className={inputClass} value={tracking} onChange={(e) => setTracking(e.target.value)} />
          </Field>
        </div>
        <Field label="Estimated delivery date" htmlFor="dp-eta">
          <input id="dp-eta" type="date" className={inputClass} value={eta} onChange={(e) => setEta(e.target.value)} />
        </Field>
        <Field label="Delivery notes" htmlFor="dp-notes">
          <textarea id="dp-notes" rows={2} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Modal>);

}