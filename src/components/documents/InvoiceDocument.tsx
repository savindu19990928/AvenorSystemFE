import React from 'react';
import type { InvoiceDetail, OrderDetail } from '../../types/api';
import type { BrandIdentity, PrintLineItem, TotalRow } from '../../types/print';
import { formatDate, formatMoney, humanize, toNumber, toPrintLine } from '../../utils/format';
import { DocumentPaper } from '../print/DocumentPaper';
import { PrintItemsTable } from '../print/PrintItemsTable';
import { PrintTotals } from '../print/PrintTotals';
import { PrintParty } from '../print/PrintParty';

interface InvoiceDocumentProps {
  invoice: InvoiceDetail;
  order: OrderDetail | null;
  brand: BrandIdentity;
}

export function InvoiceDocument({ invoice, order, brand }: InvoiceDocumentProps) {
  const items: PrintLineItem[] = invoice.items?.length ?
  invoice.items.map((i) => ({ product_name: i.product_name, details: i.description ? [i.description] : [], quantity: i.quantity, unit_price: i.unit_price, total_price: i.total_price })) :
  (order?.items ?? []).map(toPrintLine);
  const payments = invoice.payments?.length ? invoice.payments : order?.payments ?? [];
  const company = invoice.customer_company || order?.customer_company;
  const person = invoice.customer_name || order?.customer_name || '';

  const totals: TotalRow[] = [
  ...(invoice.subtotal !== undefined ? [{ label: 'Subtotal', value: invoice.subtotal }] : []),
  ...(toNumber(order?.artwork_charges) ? [{ label: 'Artwork / design', value: order?.artwork_charges }] : []),
  ...(toNumber(invoice.delivery_fee) ? [{ label: 'Delivery', value: invoice.delivery_fee }] : []),
  ...(toNumber(invoice.discount_amount) ? [{ label: 'Discount', value: invoice.discount_amount, kind: 'deduct' as const }] : []),
  ...(toNumber(invoice.tax_amount) ? [{ label: 'Tax', value: invoice.tax_amount }] : []),
  { label: 'Total', value: invoice.total_amount, kind: 'total' },
  { label: 'Paid', value: invoice.paid_amount, kind: 'deduct' },
  { label: 'Balance due', value: invoice.balance_amount, kind: 'due' }];


  const stamp = invoice.status === 'PAID' ? { label: 'Paid', tone: 'ok' as const } : invoice.status === 'CANCELLED' ? { label: 'Cancelled', tone: 'danger' as const } : undefined;

  return (
    <DocumentPaper
      brand={brand}
      title="Invoice"
      number={invoice.invoice_number}
      stamp={stamp}
      meta={[
      { label: 'Invoice date', value: formatDate(invoice.invoice_date) },
      { label: 'Due date', value: formatDate(invoice.due_date) },
      { label: 'Order', value: invoice.order_code ?? order?.order_id ?? '' },
      { label: 'Status', value: humanize(invoice.status) }]
      }>
      
      <div className="grid grid-cols-2 gap-8">
        <PrintParty label="Bill to" name={company || person} lines={[company ? person : '', order?.customer_phone]} />
        <PrintParty label="Deliver to" name={order?.delivery_address || '—'} lines={[]} />
      </div>
      <PrintItemsTable items={items} />
      <PrintTotals rows={totals} />
      {payments.length > 0 &&
      <section className="print-avoid-break">
          <p className="mb-1 text-[11px] text-faint">Payments received</p>
          <table className="w-full text-xs">
            <tbody>
              {payments.map((p) =>
            <tr key={p.payment_id} className="border-b border-line">
                  <td className="py-1.5 pr-3 font-mono">{p.payment_id}</td>
                  <td className="py-1.5 pr-3">{formatDate(p.payment_date)}</td>
                  <td className="py-1.5 pr-3">{p.payment_type_display ?? humanize(p.payment_type)}</td>
                  <td className="py-1.5 pr-3 text-muted">{p.payment_method_display ?? humanize(p.payment_method)}{p.reference_number ? ` · ${p.reference_number}` : ''}</td>
                  <td className="py-1.5 text-right tabular-nums">{formatMoney(p.amount)}</td>
                </tr>
            )}
            </tbody>
          </table>
        </section>
      }
      <p className="text-xs text-muted">Please quote {invoice.invoice_number} with your payment. Thank you for your business.</p>
    </DocumentPaper>);

}