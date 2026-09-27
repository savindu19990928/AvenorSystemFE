import React, { useEffect, useState } from 'react';
import type { OrderRef } from '../../types/workflow';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { OrderSelect } from '../forms/OrderSelect';
import { inputClass } from '../../utils/styles';

export function GenerateInvoiceModal({ open, onClose, onDone, order }: {open: boolean;onClose: () => void;onDone: () => void;order?: OrderRef | null;}) {
  const [orderCode, setOrderCode] = useState<string>('');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [dueDays, setDueDays] = useState('14');
  const { run, pending } = useAction();

  useEffect(() => {
    if (!open) return;
    setOrderCode(order?.order_id ?? '');
    setOrderId(order?.id ?? null);
    setDueDays('14');
  }, [open, order]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await run(() => api.post('/api/billing/invoices/generate-from-order/', { order_id: orderCode, due_days: Number(dueDays) }), 'Invoice generated from order');
    if (res !== undefined) onDone();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate invoice"
      description="Line items, discounts, delivery and tax are copied from the order — no manual entry."
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="invoice-form" loading={pending} disabled={!orderCode}>
            Generate invoice
          </Button>
        </>
      }>
      
      <form id="invoice-form" onSubmit={submit} className="space-y-4">
        {order ?
        <p className="text-sm">Order <span className="font-mono font-medium">{order.order_id}</span></p> :

        <Field label="Order" htmlFor="inv-order" required>
            <OrderSelect
            id="inv-order"
            value={orderId}
            onChange={(o) => {
              setOrderId(o?.id ?? null);
              setOrderCode(o?.order_id ?? '');
            }} />
          
          </Field>
        }
        <Field label="Payment due in (days)" htmlFor="inv-due">
          <input id="inv-due" type="number" min={0} className={inputClass} value={dueDays} onChange={(e) => setDueDays(e.target.value)} />
        </Field>
      </form>
    </Modal>);

}