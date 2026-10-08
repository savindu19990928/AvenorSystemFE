import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { AutoPaymentResult } from '../../types/api';
import type { OrderRef } from '../../types/workflow';
import { autoPaymentMessage, submitAutoPayment, suggestedDeposit, type AutoPaymentMode, type AutoPaymentValues } from '../../utils/billing';
import { useAction } from '../../hooks/useAction';
import { toNumber } from '../../utils/format';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AutoPaymentFields } from './AutoPaymentFields';

interface AutoPaymentModalProps {
  mode: AutoPaymentMode | null;
  order: OrderRef;
  onClose: () => void;
  onDone: (result: AutoPaymentResult) => void;
}

const EMPTY: AutoPaymentValues = { amount: '', payment_method: 'BANK_TRANSFER', reference_number: '', notes: '' };

export function AutoPaymentModal({ mode, order, onClose, onDone }: AutoPaymentModalProps) {
  const [values, setValues] = useState<AutoPaymentValues>(EMPTY);
  const { run, pending, fieldErrors } = useAction();
  const balance = toNumber(order.balance_amount);

  useEffect(() => {
    if (!mode) return;
    setValues({ ...EMPTY, amount: mode === 'deposit' ? String(suggestedDeposit(order)) : '' });
  }, [mode, order]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mode) return;
    const res = await run(() => submitAutoPayment(order.id, mode, values));
    if (res) {
      toast.success(autoPaymentMessage(mode, res));
      onDone(res);
    }
  };

  const valid = mode === 'complete' ? balance > 0 : Number(values.amount) > 0;

  return (
    <Modal
      open={mode !== null}
      onClose={onClose}
      title={mode === 'complete' ? 'Mark payment completed' : 'Record deposit'}
      description={`Against ${order.order_id}`}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="auto-payment-form" loading={pending} disabled={!valid}>
            {mode === 'complete' ? 'Settle balance' : 'Record deposit'}
          </Button>
        </>
      }>
      
      {mode &&
      <form id="auto-payment-form" onSubmit={submit}>
          <AutoPaymentFields mode={mode} values={values} onChange={(p) => setValues((v) => ({ ...v, ...p }))} balance={balance} idPrefix="ap" fieldErrors={fieldErrors} />
        </form>
      }
    </Modal>);

}