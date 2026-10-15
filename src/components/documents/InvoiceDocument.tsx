import React from 'react';
import type { InvoiceDetail, OrderDetail } from '../../types/api';
import type { BrandIdentity } from '../../types/print';
import { formatAmount, formatLongDate, toNumber } from '../../utils/format';
import { AvenorCommercialLayout } from '../print/commercial/AvenorCommercialLayout';
import { AvenorDocTable, type AvenorDocTableItem, type ExtraTotalRow } from '../print/commercial/AvenorDocTable';

interface InvoiceDocumentProps {
  invoice: InvoiceDetail;
  order: OrderDetail | null;
  brand: BrandIdentity;
}

export function InvoiceDocument({ invoice, order, brand }: InvoiceDocumentProps) {
  const companyNameCustomer = invoice.customer_company || order?.customer_company;
  const person = invoice.customer_name || order?.customer_name || '';
  const orderCode = invoice.order_code ?? order?.order_id ?? '';
  const balance = toNumber(invoice.balance_amount);
  const paid = toNumber(invoice.paid_amount);
  const cancelled = invoice.status === 'CANCELLED';
  const isPaid = invoice.status === 'PAID';
  const payments = invoice.payments?.length ? invoice.payments : order?.payments ?? [];

  // Map invoice line items or order items
  const rawItems = invoice.items?.length ? invoice.items : order?.items ?? [];
  const items: AvenorDocTableItem[] = rawItems.map((i: any) => ({
    id: i.id,
    product_name: i.product_name,
    description: i.description,
    quantity: i.quantity,
    size: i.size,
    sizes: i.sizes,
    colour: i.colour,
    colours: i.colours,
    fabric_gsm: i.fabric_gsm,
    printing_method: i.printing_method,
    unit_price: i.unit_price,
    total_price: i.total_price
  }));

  // Fallback if no items present
  if (items.length === 0) {
    items.push({
      product_name: invoice.is_deposit_only
        ? `Advance Deposit (${toNumber(invoice.deposit_percentage) || 60}%) for Order ${orderCode || 'on file'}`
        : `Apparel Production & Supply - Order ${orderCode || 'on file'}`,
      quantity: 1,
      unit_price: invoice.total_amount,
      total_price: invoice.total_amount
    });
  }

  const discount = toNumber(invoice.discount_amount);
  const tax = toNumber(invoice.tax_amount);
  const artwork = toNumber(order?.artwork_charges);
  const delivery = toNumber(invoice.delivery_fee);

  const extraRows: ExtraTotalRow[] = [
    ...(artwork > 0 ? [{ label: 'Artwork / Design', value: artwork }] : []),
    ...(delivery > 0 ? [{ label: 'Delivery Fee', value: delivery }] : []),
    ...(paid > 0 ? [{ label: 'Paid to Date', value: paid, isDeduct: true }] : []),
    { label: 'Balance Due', value: balance, isDue: balance > 0 }
  ];

  const metaItems = [
    { label: 'INVOICE NO :', value: invoice.invoice_number },
    { label: 'DATE :', value: formatLongDate(invoice.invoice_date) },
    {
      label: 'DUE DATE :',
      value: invoice.due_date ? formatLongDate(invoice.due_date) : orderCode ? `Order ${orderCode}` : 'Upon Delivery'
    }
  ];

  const stamp = isPaid
    ? { label: 'PAID IN FULL', tone: 'ok' as const }
    : cancelled
      ? { label: 'CANCELLED', tone: 'danger' as const }
      : balance <= 0
        ? { label: 'SETTLED', tone: 'ok' as const }
        : undefined;

  const paymentTermsText =
    invoice.payment_terms ||
    (isPaid
      ? 'Invoice has been paid in full. Thank you for your business!'
      : balance > 0
        ? `Remaining balance of Rs. ${formatAmount(balance)} is due by ${formatLongDate(invoice.due_date)}.`
        : '60% Advance Payment required on confirmation. Remainder on delivery.');

  const deliveryNotesText =
    order?.delivery_address
      ? `Delivery to: ${order.delivery_address}`
      : 'Islandwide courier delivery will be arranged upon order readiness.';

  return (
    <AvenorCommercialLayout
      documentTitle="INVOICE"
      brand={brand}
      metaItems={metaItems}
      customerName={person}
      customerCompany={companyNameCustomer}
      customerPhone={order?.customer_phone}
      customerAddress={order?.delivery_address}
      customerSignatureLabel="Received by Customer"
      stamp={stamp}
      notes={
        orderCode
          ? `Reference Order: ${orderCode}. Please quote Invoice #${invoice.invoice_number} on all bank transfers.`
          : undefined
      }
    >
      <AvenorDocTable
        items={items}
        subtotal={invoice.subtotal ?? invoice.total_amount}
        discount={discount}
        tax={tax}
        grandTotal={invoice.total_amount}
        extraRows={extraRows}
        minRows={5}
        paymentTerms={paymentTermsText}
        deliveryNotes={deliveryNotesText}
      />

      {/* Payments History (if payments were recorded) */}
      {payments.length > 0 && (
        <div className="print-avoid-break mt-3 rounded-[2px] border border-[#d2dbe8] bg-[#f8fbfe] p-2.5 text-[10.5px]">
          <p className="font-extrabold uppercase tracking-wider text-[#0a1d44] text-[10px]">
            Payment Records Received
          </p>
          <div className="mt-1 space-y-0.5">
            {payments.map((p, idx) => (
              <div key={p.id ?? idx} className="flex items-center justify-between border-b border-[#e2e8f0] pb-0.5 text-ink">
                <span>
                  <strong>{p.payment_id}</strong> &middot; {formatLongDate(p.payment_date)} &middot; {p.payment_method_display || p.payment_method}
                  {p.reference_number ? ` (Ref: ${p.reference_number})` : ''}
                </span>
                <span className="font-bold text-[#0a1d44]">Rs. {formatAmount(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AvenorCommercialLayout>
  );
}