import React from 'react';
import { ZapIcon } from 'lucide-react';
import type { AutoPaymentMode, AutoPaymentValues } from '../../utils/billing';
import { PAYMENT_METHODS } from '../../data/workflow';
import { formatMoney } from '../../utils/format';
import { inputClass } from '../../utils/styles';
import { Field } from '../ui/Field';

interface AutoPaymentFieldsProps {
  mode: AutoPaymentMode;
  values: AutoPaymentValues;
  onChange: (patch: Partial<AutoPaymentValues>) => void;
  balance: number;
  idPrefix: string;
  fieldErrors?: Record<string, string>;
}

export function AutoPaymentFields({ mode, values, onChange, balance, idPrefix, fieldErrors = {} }: AutoPaymentFieldsProps) {
  return (
    <div className="space-y-4">
      <p className="flex gap-2 rounded-md bg-accent-soft px-3 py-2.5 text-xs text-accent-strong">
        <ZapIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {mode === 'deposit' ?
        'A deposit payment is recorded automatically, order balances and the linked invoice are updated, and the order moves to Deposit received.' :
        `The remaining balance of ${formatMoney(balance)} is recorded automatically as the final payment, and the linked invoice is marked Paid.`}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {mode === 'deposit' ?
        <Field label="Deposit amount (Rs.)" htmlFor={`${idPrefix}-amt`} required error={fieldErrors.amount}>
            <input
            id={`${idPrefix}-amt`}
            type="number"
            min={0}
            step="0.01"
            required
            className={inputClass}
            value={values.amount}
            onChange={(e) => onChange({ amount: e.target.value })} />
          
          </Field> :

        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink">Amount to settle</span>
            <span className="flex h-9 items-center text-sm font-semibold tabular-nums">{formatMoney(balance)}</span>
          </div>
        }
        <Field label="Method" htmlFor={`${idPrefix}-method`} required error={fieldErrors.payment_method}>
          <select id={`${idPrefix}-method`} className={inputClass} value={values.payment_method} onChange={(e) => onChange({ payment_method: e.target.value })}>
            {PAYMENT_METHODS.map((m) =>
            <option key={m.value} value={m.value}>{m.label}</option>
            )}
          </select>
        </Field>
        <Field label="Reference number" htmlFor={`${idPrefix}-ref`} error={fieldErrors.reference_number} className="sm:col-span-2">
          <input id={`${idPrefix}-ref`} className={inputClass} value={values.reference_number} onChange={(e) => onChange({ reference_number: e.target.value })} />
        </Field>
      </div>
      <Field label="Notes" htmlFor={`${idPrefix}-notes`}>
        <textarea id={`${idPrefix}-notes`} rows={2} className={inputClass} value={values.notes} onChange={(e) => onChange({ notes: e.target.value })} />
      </Field>
    </div>);

}