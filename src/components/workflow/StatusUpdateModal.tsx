import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Money, OrderStatus } from '../../types/api';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { useAuth } from '../../contexts/AuthContext';
import { ORDER_PIPELINE, canSetStatus, nextStatus } from '../../data/workflow';
import { autoPaymentMessage, submitAutoPayment, suggestedDeposit, type AutoPaymentMode, type AutoPaymentValues } from '../../utils/billing';
import { humanize, toNumber } from '../../utils/format';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { AutoPaymentFields } from './AutoPaymentFields';
import { inputClass } from '../../utils/styles';

interface StatusUpdateModalProps {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  orderId: number;
  current: OrderStatus;
  initial?: OrderStatus | null;
  finance?: {total_amount?: Money;balance_amount?: Money;deposit_required?: Money;};
}

const AUTO_MODES: Partial<Record<OrderStatus, AutoPaymentMode>> = { DEPOSIT_RECEIVED: 'deposit', PAYMENT_COMPLETED: 'complete' };

export function StatusUpdateModal({ open, onClose, onDone, orderId, current, initial, finance = {} }: StatusUpdateModalProps) {
  const { role } = useAuth();
  const allowed = ORDER_PIPELINE.filter((s) => s !== current && canSetStatus(role, s));
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState<AutoPaymentValues>({ amount: '', payment_method: 'BANK_TRANSFER', reference_number: '', notes: '' });
  const { run, pending, fieldErrors } = useAction();
  const autoMode = status ? AUTO_MODES[status] : undefined;
  const balance = toNumber(finance.balance_amount);

  useEffect(() => {
    if (!open) return;
    const next = initial ?? nextStatus(current);
    setStatus(next && allowed.includes(next) ? next : allowed[0] ?? '');
    setNotes('');
    setPayment({ amount: String(suggestedDeposit(finance)), payment_method: 'BANK_TRANSFER', reference_number: '', notes: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, current, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return;
    if (autoMode) {
      const res = await run(() => submitAutoPayment(orderId, autoMode, payment));
      if (res) {
        toast.success(autoPaymentMessage(autoMode, res));
        onDone();
      }
      return;
    }
    const res = await run(() => api.post(`/api/orders/orders/${orderId}/update-status/`, { status, notes }), `Order moved to ${humanize(status)}`);
    if (res !== undefined) onDone();
  };

  const valid = !!status && (autoMode !== 'deposit' || Number(payment.amount) > 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update order status"
      description={`Currently ${humanize(current)}. Every change is written to the audit log.`}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="status-form" loading={pending} disabled={!valid}>
            {autoMode === 'deposit' ? 'Record deposit' : autoMode === 'complete' ? 'Settle & complete' : 'Update status'}
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
          {autoMode ?
        <AutoPaymentFields
          mode={autoMode}
          values={payment}
          onChange={(p) => setPayment((v) => ({ ...v, ...p }))}
          balance={balance}
          idPrefix="st-pay"
          fieldErrors={fieldErrors} /> :


        <Field label="Notes" htmlFor="st-notes">
              <textarea id="st-notes" rows={3} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
        }
        </form>
      }
    </Modal>);

}