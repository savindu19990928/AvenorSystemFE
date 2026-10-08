import React from 'react';
import type { TotalRow } from '../../../types/print';
import { formatAmount } from '../../../utils/format';
import { cx } from '../../../utils/styles';
import { DocLabel } from './DocLabel';

interface SummaryPanelProps {
  label: string;
  paragraphs: string[];
  rows: TotalRow[];
}

/** Basis / terms note on the left, money summary on the right. */
export function SummaryPanel({ label, paragraphs, rows }: SummaryPanelProps) {
  return (
    <div className="print-avoid-break mx-9 grid grid-cols-[1fr_296px] border border-doc-rule">
      <div className="bg-doc-cream px-3 py-3">
        <DocLabel>{label}</DocLabel>
        {paragraphs.map((p) =>
        <p key={p} className="mt-1 whitespace-pre-line">{p}</p>
        )}
      </div>
      <dl className="flex flex-col justify-center gap-0.5 border-l border-doc-rule px-2 py-3">
        {rows.map((r, idx) => {
          const value = r.text ?? `${r.kind === 'deduct' ? '−' : ''}${formatAmount(r.value)}`;
          return (
            <div
              key={r.label}
              className={cx(
                'flex items-center justify-between gap-4 px-1.5',
                !r.kind || r.kind === 'deduct' ? 'py-1.5' : 'mt-1.5 py-2 font-bold uppercase',
                !r.kind && idx === 0 && 'bg-doc-panel',
                r.kind === 'total' && 'bg-doc-navy text-[12px] text-white',
                r.kind === 'due' && 'border border-doc-gold bg-doc-cream text-[12px] text-doc-navy'
              )}>
              
              <dt className={r.kind === 'total' || r.kind === 'due' ? '' : 'text-muted'}>{r.label}</dt>
              <dd className={cx('font-bold tabular-nums', !r.kind || r.kind === 'deduct' ? 'text-doc-navy' : '')}>{value}</dd>
            </div>);

        })}
      </dl>
    </div>);

}