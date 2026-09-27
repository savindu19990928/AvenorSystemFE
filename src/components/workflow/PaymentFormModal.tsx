import React, { useEffect, useState } from 'react';
import type { Invoice } from '../../types/api';
import type { OrderRef } from '../../types/workflow';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { useAction } from '../../hooks/useAction';
import { PAYMENT_METHODS, PAYMENT_TYPES } from '../../data/workflow';
import { formatMoney, todayISO, toNumber } from '../../utils/format';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { OrderSelect } from '../forms/OrderSelect';
import { inputClass } from '../../utils/styles';

interface PaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  order?: OrderRef | null;
  defaultType?: 'DEPOSIT' | 'BALANCE';
}

export function PaymentFormModal({ open, onClose, onDone, order, defaultType = 'BALANCE' }: PaymentFormModalProps) {
  const [orderRef, setOrderRef] = useState<OrderRef | null>(order ?? null);
  const [invoice, setInvoice] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<string>(defaultType);
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const { run, pending, fieldErrors } = useAction();

  const invoices = useApi(
    () => orderRef ? api.list<Invoice>('/api/billing/invoices/', { order: orderRef.id }) : Promise.resolve([] as Invoice[]),
    [orderRef?.id]
  );

  useEffect(() => {
    if (!open) return;
    setOrderRef(order ?? null);
    setInvoice('');
    setAmount(order?.balance_amount && toNumber(order.balance_amount) > 0 ? String(toNumber(order.balance_amount)) : '');
    setType(defaultType);
    setMethod('BANK_TRANSFER');
    setReference('');
    setDate(todayISO());
    setNotes('');
  }, [open, order, defaultType]);

  const openInvoices = (invoices.data ?? []).filter((i) => i.status !== 'CANCELLED' && i.id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderRef) return;
    const res = await run(
      () =>
      api.post('/api/billing/payments/', {
        order: orderRef.id,
        invoice: invoice ? Number(invoice) : null,
        amount: Number(amount).toFixed(2),
        payment_type: type,
        payment_method: method,
        reference_number: reference,
        payment_date: date,
        notes
      }),
      `Payment of ${formatMoney(amount)} recorded`
    );
    if (res !== undefined) onDone();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record payment"
      description={orderRef ? `Against ${orderRef.order_id}` : 'Deposits and balance payments are tracked separately.'}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="payment-form" loading={pending} disabled={!orderRef || !(Number(amount) > 0)}>
            Record payment
          </Button>
        </>
      }>
      
      <form id="payment-form" onSubmit={submit} className="space-y-4">
        {!order &&
        <Field label="Order" htmlFor="pm-order" required>
            <OrderSelect id="pm-order" value={orderRef?.id ?? null} onChange={(o) => setOrderRef(o ? { id: o.id, order_id: o.order_id, balance_amount: o.balance_amount } : null)} />
          </Field>
        }
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Payment type" htmlFor="pm-type" required>
            <select id="pm-type" className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
              {PAYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Amount (Rs.)" htmlFor="pm-amt" required error={fieldErrors.amount}>
            <input id="pm-amt" type="number" min={0} step="0.01" required className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Method" htmlFor="pm-method" required>
            <select id="pm-method" className={inputClass} value={method} onChange={(e) => setMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </Field>
          <Field label="Payment date" htmlFor="pm-date" required>
            <input id="pm-date" type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Invoice" htmlFor="pm-inv" hint={orderRef && openInvoices.length === 0 ? 'No invoice yet — fine for deposits.' : undefined}>
            <select id="pm-inv" className={inputClass} value={invoice} onChange={(e) => setInvoice(e.target.value)} disabled={!orderRef}>
              <option value="">Not linked</option>
              {openInvoices.map((i) => <option key={i.id} value={i.id}>{i.invoice_number} · balance {formatMoney(i.balance_amount)}</option>)}
            </select>
          </Field>
          <Field label="Reference number" htmlFor="pm-ref">
            <input id="pm-ref" className={inputClass} value={reference} onChange={(e) => setReference(e.target.value)} />
          </Field>
        </div>
        <Field label="Notes" htmlFor="pm-notes">
          <textarea id="pm-notes" rows={2} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Modal>);

}