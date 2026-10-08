import React from 'react';
import type { Payment } from '../../../types/api';
import { formatAmount, formatDate, humanize } from '../../../utils/format';

export function PaymentsReceivedTable({ payments }: {payments: Payment[];}) {
  return (
    <section className="print-avoid-break">
      <h2 className="text-[13px] font-bold uppercase text-doc-navy">Payments received</h2>
      <div className="mt-2 px-9">
        <table className="w-full border-collapse text-[11.5px]">
          <thead>
            <tr className="border-b-2 border-doc-navy text-left text-[10px] font-bold uppercase text-doc-navy">
              <th className="px-2.5 py-1.5">Receipt</th>
              <th className="px-2.5 py-1.5">Date</th>
              <th className="px-2.5 py-1.5">Type</th>
              <th className="px-2.5 py-1.5">Method / reference</th>
              <th className="px-2.5 py-1.5 text-right">Amount (LKR)</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) =>
            <tr key={p.payment_id} className="border-b border-doc-rule">
                <td className="px-2.5 py-1.5 font-mono">{p.payment_id}</td>
                <td className="px-2.5 py-1.5">{formatDate(p.payment_date)}</td>
                <td className="px-2.5 py-1.5">{p.payment_type_display ?? humanize(p.payment_type)}</td>
                <td className="px-2.5 py-1.5 text-muted">
                  {p.payment_method_display ?? humanize(p.payment_method)}
                  {p.reference_number ? ` · ${p.reference_number}` : ''}
                </td>
                <td className="px-2.5 py-1.5 text-right font-bold tabular-nums text-doc-navy">{formatAmount(p.amount)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>);

}