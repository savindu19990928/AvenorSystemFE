import React from 'react';
import type { InvoiceDetail, OrderDetail } from '../../types/api';
import type { BrandIdentity, DocNote } from '../../types/print';
import { company } from '../../data/company';
import { invoiceDepositAmount, invoiceDepositPercent } from '../../utils/billing';
import { formatAmount, formatLongDate, toNumber } from '../../utils/format';
import { CommercialPaper } from '../print/commercial/CommercialPaper';
import { PartyPanels } from '../print/commercial/PartyPanels';
import { AvenorCommercialTable, type AvenorLineItem, type ExtraTotalRow } from '../print/commercial/AvenorCommercialTable';
import { NotesGrid } from '../print/commercial/NotesGrid';
import { PaymentsReceivedTable } from '../print/commercial/PaymentsReceivedTable';
import { CommercialSignatures } from '../print/commercial/CommercialSignatures';

interface InvoiceDocumentProps {
  invoice: InvoiceDetail;
  order: OrderDetail | null;
  brand: BrandIdentity;
}

export function InvoiceDocument({ invoice, order, brand }: InvoiceDocumentProps) {
  const rawItems = invoice.items?.length ? invoice.items : order?.items ?? [];
  const payments = invoice.payments?.length ? invoice.payments : order?.payments ?? [];
  const companyNameCustomer = invoice.customer_company || order?.customer_company;
  const person = invoice.customer_name || order?.customer_name || '';
  const orderCode = invoice.order_code ?? order?.order_id ?? '';
  const balance = toNumber(invoice.balance_amount);
  const companyName = (brand.company || company.name).toUpperCase();
  const cancelled = invoice.status === 'CANCELLED';

  const tableItems: AvenorLineItem[] = rawItems.map((i: any) => ({
    id: i.id,
    product_name: i.product_name,
    description: i.description,
    quantity: i.quantity,
    sizes: i.sizes,
    size: i.size,
    colours: i.colours,
    colour: i.colour,
    fabric_gsm: i.fabric_gsm,
    printing_method: i.printing_method,
    unit_price: i.unit_price,
    total_price: i.total_price
  }));

  const extraRows: ExtraTotalRow[] = [
    ...(toNumber(order?.artwork_charges) > 0 ? [{ label: 'Artwork / design', value: order?.artwork_charges }] : []),
    ...(toNumber(invoice.delivery_fee) > 0 ? [{ label: 'Delivery fee', value: invoice.delivery_fee }] : []),
    ...(toNumber(invoice.paid_amount) > 0 ? [{ label: 'Paid to date', value: invoice.paid_amount, deduct: true }] : []),
    ...(toNumber(invoice.balance_amount) > 0 ? [{ label: 'Balance due', value: invoice.balance_amount }] : [])
  ];

  const pct = invoiceDepositPercent(invoice);
  const summary = [
    invoice.payment_terms || `${pct}% advance deposit (LKR ${formatAmount(invoiceDepositAmount(invoice))}) on confirmation, remainder on delivery.`,
    cancelled
      ? 'This invoice has been cancelled and is kept for record only.'
      : balance > 0
        ? `Balance of LKR ${formatAmount(balance)} is due by ${formatLongDate(invoice.due_date)}.`
        : 'This invoice has been settled in full. Thank you for your business.'
  ];

  const notes: DocNote[] = [
    { label: 'Payment reference', text: `Please quote ${invoice.invoice_number} with every payment so it is matched to order ${orderCode || 'on file'}.` },
    { label: 'Delivery address', text: order?.delivery_address || 'As agreed with the customer.' },
    { label: 'Payment methods', text: `Bank transfer, cheque, card or cash. Send remittance advice to ${company.email}.` },
    { label: 'Branding & specifications', text: `Produced under the ${brand.name} label to the specifications approved for this order.` }
  ];

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
        `Currency: ${company.currency}`
      ]}
    >
      <PartyPanels
        partyLabel="Bill to"
        partyName={person || companyNameCustomer || ''}
        partyLines={[person ? companyNameCustomer : '', order?.customer_phone]}
        brand={brand}
      />

      {/* Commercial Items Table matching Quotation Table format */}
      <AvenorCommercialTable
        items={tableItems}
        subtotal={invoice.subtotal ?? invoice.total_amount}
        discount={invoice.discount_amount}
        tax={invoice.tax_amount}
        total={invoice.total_amount}
        totalLabel="TOTAL COST"
        currencyPrefix="LKR"
        extraRows={extraRows}
        minRows={5}
      />

      {/* Payment Terms Note */}
      <div className="rounded border border-[#d8e4f0] bg-[#f8fbfe] p-3 text-[11.5px] leading-relaxed">
        <p className="font-bold text-[#0b2545] uppercase tracking-wide text-[10.5px]">Payment Terms & Status</p>
        {summary.map((p) => (
          <p key={p} className="mt-1 text-ink">{p}</p>
        ))}
      </div>

      {payments.length > 0 && <PaymentsReceivedTable payments={payments} />}
      <NotesGrid title="Payment & delivery notes" notes={notes} />
      <CommercialSignatures labels={[`For ${companyName}`, 'Received by customer']} />
    </CommercialPaper>
  );
}