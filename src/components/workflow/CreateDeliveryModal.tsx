import React, { useEffect, useState } from 'react';
import type { OrderRef } from '../../types/workflow';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { OrderSelect } from '../forms/OrderSelect';
import { inputClass } from '../../utils/styles';

export function CreateDeliveryModal({ open, onClose, onDone, order }: {open: boolean;onClose: () => void;onDone: () => void;order?: OrderRef | null;}) {
  const [orderId, setOrderId] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const { run, pending } = useAction();

  useEffect(() => {
    if (!open) return;
    setOrderId(order?.id ?? null);
    setAddress(order?.delivery_address ?? '');
  }, [open, order]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await run(() => api.post('/api/delivery/deliveries/', { order: orderId, delivery_address: address, status: 'READY' }), 'Delivery created');
    if (res !== undefined) onDone();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create delivery"
      description={order ? `For ${order.order_id}` : 'Orders marked ready for delivery are listed.'}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="delivery-form" loading={pending} disabled={!orderId || !address.trim()}>
            Create delivery
          </Button>
        </>
      }>
      
      <form id="delivery-form" onSubmit={submit} className="space-y-4">
        {!order &&
        <Field label="Order" htmlFor="dl-order" required>
            <OrderSelect id="dl-order" status="READY_FOR_DELIVERY" value={orderId} onChange={(o) => setOrderId(o?.id ?? null)} />
          </Field>
        }
        <Field label="Delivery address" htmlFor="dl-addr" required>
          <input id="dl-addr" required className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
      </form>
    </Modal>);

}