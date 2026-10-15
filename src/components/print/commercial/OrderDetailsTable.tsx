import React from 'react';
import type { CommercialLine } from '../../../types/print';
import { formatAmount, formatNumber } from '../../../utils/format';
import { cx } from '../../../utils/styles';

export function OrderDetailsTable({ lines }: {lines: CommercialLine[];}) {
  return (
    <section>
      <h2 className="text-[13px] font-bold uppercase text-doc-navy">Order details</h2>
      <div className="mt-2 px-9">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-doc-navy text-left text-[10.5px] font-bold uppercase text-white">
              <th className="w-10 px-2.5 py-2.5">No.</th>
              <th className="px-2.5 py-2.5">Style / Description</th>
              <th className="w-20 px-2.5 py-2.5 text-center">Qty</th>
              <th className="w-20 px-2.5 py-2.5 text-center">Sizes</th>
              <th className="w-32 px-2.5 py-2.5 text-right">Unit price (LKR)</th>
              <th className="w-32 px-2.5 py-2.5 text-right">Line total (LKR)</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ?
            <tr>
                <td colSpan={6} className="border-b border-doc-rule py-6 text-center text-muted">No line items</td>
              </tr> :

            lines.map((l, idx) =>
            <tr key={idx} className={cx('print-avoid-break border-b border-doc-rule align-top', idx % 2 === 1 && 'bg-doc-panel')}>
                  <td className="px-2.5 py-3 tabular-nums">{String(idx + 1).padStart(2, '0')}</td>
                  <td className="px-2.5 py-3">
                    <p>{l.description}</p>
                    {l.details.map((d) =>
                <p key={d} className="text-[11px] text-muted">{d}</p>
                )}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-3 text-center tabular-nums">{formatNumber(l.quantity)} pcs</td>
                  <td className="px-2.5 py-3 text-center">{l.sizes || '—'}</td>
                  <td className="px-2.5 py-3 text-right tabular-nums">{formatAmount(l.unit_price)}</td>
                  <td className="px-2.5 py-3 text-right font-bold tabular-nums text-doc-navy">{formatAmount(l.total_price)}</td>
                </tr>
            )
            }
          </tbody>
        </table>
      </div>
    </section>);

}