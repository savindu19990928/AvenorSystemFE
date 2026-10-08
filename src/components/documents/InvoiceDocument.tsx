import React from 'react';
import type { InvoiceDetail, OrderDetail } from '../../types/api';
import type { BrandIdentity, DocNote, TotalRow } from '../../types/print';
import { company } from '../../data/company';
import { invoiceDepositAmount, invoiceDepositPercent } from '../../utils/billing';
import { formatAmount, formatLongDate, toCommercialLine, toNumber } from '../../utils/format';
import { CommercialPaper } from '../print/commercial/CommercialPaper';
import { PartyPanels } from '../print/commercial/PartyPanels';
import { OrderDetailsTable } from '../print/commercial/OrderDetailsTable';
import { SummaryPanel } from '../print/commercial/SummaryPanel';
import { NotesGrid } from '../print/commercial/NotesGrid';
import { PaymentsReceivedTable } from '../print/commercial/PaymentsReceivedTable';
import { CommercialSignatures } from '../print/commercial/CommercialSignatures';

interface InvoiceDocumentProps {
  invoice: InvoiceDetail;
  order: OrderDetail | null;
  brand: BrandIdentity;
}

export function InvoiceDocument({ invoice, order, brand }: InvoiceDocumentProps) {
  const lines = invoice.items?.length ? invoice.items.map(toCommercialLine) : (order?.items ?? []).map(toCommercialLine);
  const payments = invoice.payments?.length ? invoice.payments : order?.payments ?? [];
  const companyNameCustomer = invoice.customer_company || order?.customer_company;
  const person = invoice.customer_name || order?.customer_name || '';
  const orderCode = invoice.order_code ?? order?.order_id ?? '';
  const balance = toNumber(invoice.balance_amount);
  const companyName = (brand.company || company.name).toUpperCase();
  const cancelled = invoice.status === 'CANCELLED';

  const rows: TotalRow[] = [
  ...(invoice.subtotal !== undefined ? [{ label: 'Subtotal', value: invoice.subtotal }] : []),
  ...(toNumber(order?.artwork_charges) ? [{ label: 'Artwork / design', value: order?.artwork_charges }] : []),
  ...(toNumber(invoice.delivery_fee) ? [{ label: 'Delivery', value: invoice.delivery_fee }] : []),
  ...(toNumber(invoice.discount_amount) ? [{ label: 'Discount', value: invoice.discount_amount, kind: 'deduct' as const }] : []),
  ...(toNumber(invoice.tax_amount) ? [{ label: 'Tax', value: invoice.tax_amount }] : []),
  { label: 'Total', value: invoice.total_amount, kind: 'total' },
  { label: 'Paid to date', value: invoice.paid_amount, kind: 'deduct' },
  { label: 'Balance due', value: invoice.balance_amount, kind: 'due' }];


  const pct = invoiceDepositPercent(invoice);
  const summary = [
  invoice.payment_terms || `${pct}% advance deposit (LKR ${formatAmount(invoiceDepositAmount(invoice))}) on confirmation, remainder on delivery.`,
  cancelled ?
  'This invoice has been cancelled and is kept for record only.' :
  balance > 0 ?
  `Balance of LKR ${formatAmount(balance)} is due by ${formatLongDate(invoice.due_date)}.` :
  'This invoice has been settled in full. Thank you for your business.'];


  const notes: DocNote[] = [
  { label: 'Payment reference', text: `Please quote ${invoice.invoice_number} with every payment so it is matched to order ${orderCode || 'on file'}.` },
  { label: 'Delivery address', text: order?.delivery_address || 'As agreed with the customer.' },
  { label: 'Payment methods', text: `Bank transfer, cheque, card or cash. Send remittance advice to ${company.email}.` },
  { label: 'Branding & specifications', text: `Produced under the ${brand.name} label to the specifications approved for this order.` }];


  const stamp = invoice.status === 'PAID' ? { label: 'Paid', tone: 'ok' as const } : cancelled ? { label: 'Cancelled', tone: 'danger' as const } : undefined;

  return (
    <CommercialPaper
      brand={brand}
      title="Invoice"
      subtitle="Custom apparel order invoice"
      reference={invoice.invoice_number}
      stamp={stamp}
      dateLabel="Invoice date"
      dateValue={formatLongDate(invoice.invoice_date)}
      dateNotes={[
      ...(invoice.due_date ? [`Due ${formatLongDate(invoice.due_date)}`] : []),
      ...(orderCode ? [`Order ${orderCode}`] : []),
      `Currency: ${company.currency}`]
      }>
      
      <PartyPanels
        partyLabel="Bill to"
        partyName={person || companyNameCustomer || ''}
        partyLines={[person ? companyNameCustomer : '', order?.customer_phone]}
        brand={brand} />
      
      <OrderDetailsTable lines={lines} />
      <SummaryPanel label="Payment terms" paragraphs={summary} rows={rows} />
      {payments.length > 0 && <PaymentsReceivedTable payments={payments} />}
      <NotesGrid title="Payment & delivery notes" notes={notes} />
      <CommercialSignatures labels={[`For ${companyName}`, 'Received by customer']} />
    </CommercialPaper>);

}