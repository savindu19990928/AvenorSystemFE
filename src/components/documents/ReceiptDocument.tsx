import React from 'react';
import type { OrderDetail, Payment } from '../../types/api';
import type { BrandIdentity, DocNote, TotalRow } from '../../types/print';
import { company } from '../../data/company';
import { formatAmount, formatLongDate, humanize, toNumber } from '../../utils/format';
import { CommercialPaper } from '../print/commercial/CommercialPaper';
import { PartyPanels } from '../print/commercial/PartyPanels';
import { SummaryPanel } from '../print/commercial/SummaryPanel';
import { NotesGrid } from '../print/commercial/NotesGrid';
import { CommercialSignatures } from '../print/commercial/CommercialSignatures';
import { DocLabel } from '../print/commercial/DocLabel';

interface ReceiptDocumentProps {
  payment: Payment;
  order: OrderDetail | null;
  brand: BrandIdentity;
}

export function ReceiptDocument({ payment: p, order, brand }: ReceiptDocumentProps) {
  const customerCompany = order?.customer_company;
  const person = p.customer_name || order?.customer_name || '';
  const orderCode = p.order_code ?? order?.order_id ?? '';
  const typeLabel = p.payment_type_display ?? humanize(p.payment_type);
  const methodLabel = p.payment_method_display ?? humanize(p.payment_method);
  const companyName = (brand.company || company.name).toUpperCase();
  const balance = toNumber(order?.balance_amount);

  const details = [
  { label: 'Receipt no.', value: p.payment_id },
  { label: 'Payment type', value: typeLabel },
  { label: 'Method', value: methodLabel },
  { label: 'Reference', value: p.reference_number || '—' },
  { label: 'Order', value: orderCode || '—' },
  { label: 'Received by', value: p.recorded_by_name || '—' }];


  const rows: TotalRow[] = order ?
  [
  { label: 'Order total', value: order.total_amount },
  { label: 'This payment', value: p.amount, kind: 'deduct' },
  { label: 'Paid to date', value: order.paid_amount, kind: 'total' },
  { label: 'Balance remaining', value: order.balance_amount, kind: 'due' }] :

  [{ label: 'Amount received', value: p.amount, kind: 'total' }];

  const summary = [
  `Received with thanks the sum of LKR ${formatAmount(p.amount)} as ${typeLabel.toLowerCase()} by ${methodLabel.toLowerCase()}${orderCode ? ` against order ${orderCode}` : ''}.`,
  order ? balance > 0 ? `An outstanding balance of LKR ${formatAmount(balance)} remains on this order.` : 'This order is now settled in full. Thank you for your business.' : ''].
  filter(Boolean);

  const notes: DocNote[] = [
  { label: 'Remarks', text: p.notes || 'No additional remarks.' },
  { label: 'Validity', text: 'This receipt is valid subject to realisation of cheques and bank transfers.' }];


  return (
    <CommercialPaper
      brand={brand}
      title="Payment receipt"
      subtitle="Official receipt of payment"
      reference={p.payment_id}
      stamp={{ label: 'Received', tone: 'ok' }}
      dateLabel="Payment date"
      dateValue={formatLongDate(p.payment_date)}
      dateNotes={[...(orderCode ? [`Order ${orderCode}`] : []), `Currency: ${company.currency}`]}>
      
      <PartyPanels
        partyLabel="Received from"
        partyName={person || customerCompany || ''}
        partyLines={[person ? customerCompany : '', order?.customer_phone]}
        brand={brand} />
      

      <section className="print-avoid-break grid grid-cols-[1fr_260px] border border-doc-rule">
        <dl className="grid grid-cols-3">
          {details.map((d, i) =>
          <div key={d.label} className={`px-3.5 py-2.5 ${i % 3 !== 0 ? 'border-l border-doc-rule' : ''} ${i >= 3 ? 'border-t border-doc-rule' : ''}`}>
              <dt>
                <DocLabel>{d.label}</DocLabel>
              </dt>
              <dd className="mt-0.5 font-bold text-doc-navy">{d.value}</dd>
            </div>
          )}
        </dl>
        <div className="flex flex-col justify-center bg-doc-navy px-5 py-4 text-white">
          <p className="text-[11px] font-bold uppercase tracking-wide text-doc-gold">Amount received</p>
          <p className="mt-1 text-[26px] font-bold leading-none tabular-nums">LKR {formatAmount(p.amount)}</p>
        </div>
      </section>

      <SummaryPanel label="Payment acknowledgement" paragraphs={summary} rows={rows} />
      <NotesGrid title="Receipt notes" notes={notes} />
      <CommercialSignatures labels={[`For ${companyName}`, 'Customer']} />
    </CommercialPaper>);

}