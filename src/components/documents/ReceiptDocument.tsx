import React from 'react';
import type { OrderDetail, Payment } from '../../types/api';
import type { BrandIdentity } from '../../types/print';
import { formatDate, formatMoney, humanize } from '../../utils/format';
import { DocumentPaper } from '../print/DocumentPaper';
import { PrintParty } from '../print/PrintParty';
import { PrintTotals } from '../print/PrintTotals';
import { PrintSignatures } from '../print/PrintSignatures';

export function ReceiptDocument({ payment: p, order, brand }: {payment: Payment;order: OrderDetail | null;brand: BrandIdentity;}) {
  const company = order?.customer_company;
  const person = p.customer_name || order?.customer_name || '';
  const typeLabel = p.payment_type_display ?? humanize(p.payment_type);

  return (
    <DocumentPaper
      brand={brand}
      title="Payment receipt"
      number={p.payment_id}
      meta={[
      { label: 'Date', value: formatDate(p.payment_date) },
      { label: 'Method', value: p.payment_method_display ?? humanize(p.payment_method) },
      { label: 'Reference', value: p.reference_number ?? '' },
      { label: 'Order', value: p.order_code ?? order?.order_id ?? '' }]
      }>
      
      <PrintParty label="Received from" name={company || person} lines={[company ? person : '', order?.customer_phone]} />

      <section className="rounded-lg border border-line px-6 py-5">
        <p className="text-[11px] text-faint">Amount received</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{formatMoney(p.amount)}</p>
        <p className="mt-1 text-muted">
          {typeLabel} for order {p.order_code ?? order?.order_id ?? '—'}
        </p>
        {p.notes && <p className="mt-2 text-xs text-muted">{p.notes}</p>}
      </section>

      {order &&
      <PrintTotals
        rows={[
        { label: 'Order total', value: order.total_amount },
        { label: 'Paid to date', value: order.paid_amount, kind: 'deduct' },
        { label: 'Balance remaining', value: order.balance_amount, kind: 'due' }]
        } />

      }

      <PrintSignatures labels={[`Received by${p.recorded_by_name ? ` (${p.recorded_by_name})` : ''}`, 'Customer']} />
    </DocumentPaper>);

}