import React from 'react';
import { Field } from '../ui/Field';
import { formatMoney } from '../../utils/format';
import { depositAmount, isValidPercent } from '../../utils/billing';
import { cx, inputClass } from '../../utils/styles';

interface DepositPercentInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  total?: number | null;
  label?: string;
  className?: string;
}

export function DepositPercentInput({ id, value, onChange, total, label = 'Deposit to start order', className }: DepositPercentInputProps) {
  const pct = Number(value || 0);
  const valid = isValidPercent(value);
  const amount = total != null ? depositAmount(total, pct) : null;
  const hint = !valid ?
  undefined :
  amount != null ?
  `${formatMoney(amount)} now · ${formatMoney((total ?? 0) - amount)} on delivery` :
  `${Number((100 - pct).toFixed(2))}% balance on delivery`;

  return (
    <Field label={label} htmlFor={id} hint={hint} error={value !== '' && !valid ? 'Enter a percentage between 1 and 100' : undefined} required className={className}>
      <div className="relative">
        <input
          id={id}
          type="number"
          min={1}
          max={100}
          step="0.01"
          className={cx(inputClass, 'pr-8 tabular-nums')}
          value={value}
          onChange={(e) => onChange(e.target.value)} />
        
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-faint" aria-hidden>%</span>
      </div>
    </Field>);

}