import React, { useEffect, useState } from 'react';
import type { OrderRef } from '../../types/workflow';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { EXPENSE_TYPES } from '../../data/workflow';
import { todayISO } from '../../utils/format';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { OrderSelect } from '../forms/OrderSelect';
import { inputClass } from '../../utils/styles';

export function ExpenseFormModal({ open, onClose, onDone, order }: {open: boolean;onClose: () => void;onDone: () => void;order?: OrderRef | null;}) {
  const [orderId, setOrderId] = useState<number | null>(null);
  const [type, setType] = useState('TSHIRT_COST');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [actual, setActual] = useState(true);
  const [date, setDate] = useState(todayISO());
  const { run, pending } = useAction();

  useEffect(() => {
    if (!open) return;
    setOrderId(order?.id ?? null);
    setType('TSHIRT_COST');
    setAmount('');
    setDescription('');
    setActual(true);
    setDate(todayISO());
  }, [open, order]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await run(
      () => api.post('/api/analytics/expenses/', { order: orderId, expense_type: type, amount: Number(amount).toFixed(2), description, is_actual: actual, expense_date: date }),
      'Expense recorded'
    );
    if (res !== undefined) onDone();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record expense"
      description={order ? `Against ${order.order_id} — used in the profit calculation.` : 'Expenses are linked to an order for profit tracking.'}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="expense-form" loading={pending} disabled={!orderId || !(Number(amount) > 0)}>
            Record expense
          </Button>
        </>
      }>
      
      <form id="expense-form" onSubmit={submit} className="space-y-4">
        {!order &&
        <Field label="Order" htmlFor="ex-order" required>
            <OrderSelect id="ex-order" value={orderId} onChange={(o) => setOrderId(o?.id ?? null)} />
          </Field>
        }
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cost type" htmlFor="ex-type" required>
            <select id="ex-type" className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
              {EXPENSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Amount (Rs.)" htmlFor="ex-amt" required>
            <input id="ex-amt" type="number" min={0} step="0.01" required className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Date" htmlFor="ex-date">
            <input id="ex-date" type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Figure" htmlFor="ex-actual">
            <select id="ex-actual" className={inputClass} value={actual ? 'actual' : 'estimate'} onChange={(e) => setActual(e.target.value === 'actual')}>
              <option value="actual">Actual cost</option>
              <option value="estimate">Estimate</option>
            </select>
          </Field>
        </div>
        <Field label="Description" htmlFor="ex-desc">
          <input id="ex-desc" className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
      </form>
    </Modal>);

}