import React, { useEffect, useState } from 'react';
import type { OrderRef } from '../../types/workflow';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { toNumber } from '../../utils/format';
import { DEFAULT_DEPOSIT_PERCENT } from '../../data/workflow';
import { isValidPercent } from '../../utils/billing';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { OrderSelect } from '../forms/OrderSelect';
import { DepositPercentInput } from '../forms/DepositPercentInput';
import { inputClass } from '../../utils/styles';

export function GenerateInvoiceModal({ open, onClose, onDone, order }: {open: boolean;onClose: () => void;onDone: () => void;order?: OrderRef | null;}) {
  const [orderCode, setOrderCode] = useState<string>('');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [dueDays, setDueDays] = useState('14');
  const [depositPct, setDepositPct] = useState(String(DEFAULT_DEPOSIT_PERCENT));
  const { run, pending } = useAction();

  useEffect(() => {
    if (!open) return;
    setOrderCode(order?.order_id ?? '');
    setOrderId(order?.id ?? null);
    setTotal(order?.total_amount != null ? toNumber(order.total_amount) : null);
    setDueDays('14');
    setDepositPct(String(DEFAULT_DEPOSIT_PERCENT));
  }, [open, order]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await run(
      () =>
      api.post('/api/billing/invoices/generate-from-order/', {
        order_id: orderCode,
        due_days: Number(dueDays),
        deposit_percentage: Number(depositPct).toFixed(2)
      }),
      'Invoice generated from order'
    );
    if (res !== undefined) onDone();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate invoice"
      description="Line items, discounts, delivery and tax are copied from the order. Set how much the customer pays before production starts."
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="invoice-form" loading={pending} disabled={!orderCode || !isValidPercent(depositPct)}>
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
              setTotal(o ? toNumber(o.total_amount) : null);
            }} />
          
          </Field>
        }
        <div className="grid gap-4 sm:grid-cols-2">
          <DepositPercentInput id="inv-dep" value={depositPct} onChange={setDepositPct} total={total} />
          <Field label="Payment due in (days)" htmlFor="inv-due">
            <input id="inv-due" type="number" min={0} className={inputClass} value={dueDays} onChange={(e) => setDueDays(e.target.value)} />
          </Field>
        </div>
      </form>
    </Modal>);

}