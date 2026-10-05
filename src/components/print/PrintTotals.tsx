import React from 'react';
import type { TotalRow } from '../../types/print';
import { formatMoney } from '../../utils/format';
import { cx } from '../../utils/styles';

export function PrintTotals({ rows }: {rows: TotalRow[];}) {
  return (
    <dl className="print-avoid-break ml-auto w-72 space-y-1.5">
      {rows.map((r) =>
      <div
        key={r.label}
        className={cx(
          'flex justify-between gap-4',
          r.kind === 'total' && 'border-t border-ink pt-2 text-base font-semibold',
          r.kind === 'due' && 'rounded bg-canvas px-2 py-1.5 font-semibold'
        )}>
        
          <dt className={r.kind ? '' : 'text-muted'}>{r.label}</dt>
          <dd className="tabular-nums">{r.kind === 'deduct' ? '−' : ''}{formatMoney(r.value)}</dd>
        </div>
      )}
    </dl>);

}