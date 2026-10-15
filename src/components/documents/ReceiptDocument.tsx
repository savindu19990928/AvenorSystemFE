import React from 'react';
import type { OrderDetail, Payment } from '../../types/api';
import type { BrandIdentity } from '../../types/print';
import { formatAmount, formatLongDate, humanize, toNumber } from '../../utils/format';
import { AvenorCommercialLayout } from '../print/commercial/AvenorCommercialLayout';
import { AvenorDocTable, type AvenorDocTableItem, type ExtraTotalRow } from '../print/commercial/AvenorDocTable';

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
  const balance = toNumber(order?.balance_amount);
  const totalOrderAmount = order ? toNumber(order.total_amount) : toNumber(p.amount);
  const paidToDate = order ? toNumber(order.paid_amount) : toNumber(p.amount);

  // Table items from order, or representative payment line item
  const rawItems = order?.items ?? [];
  const items: AvenorDocTableItem[] = rawItems.length > 0
    ? rawItems.map((i) => ({
        id: i.id,
        product_name: i.product_name,
        quantity: i.quantity,
        size: i.size,
        sizes: i.sizes,
        colour: i.colour,
        colours: i.colours,
        fabric_gsm: i.fabric_gsm,
        printing_method: i.printing_method,
        unit_price: i.unit_price,
        total_price: i.total_price
      }))
    : [
        {
          product_name: `Payment Record — Order ${orderCode || 'on file'}`,
          description: `${typeLabel} received via ${methodLabel}${p.reference_number ? ` (Ref: ${p.reference_number})` : ''}`,
          quantity: 1,
          unit_price: p.amount,
          total_price: p.amount
        }
      ];

  const extraRows: ExtraTotalRow[] = [
    { label: 'Amount Received (This Record)', value: p.amount, isDeduct: true },
    ...(order
      ? [
          { label: 'Paid to Date', value: paidToDate },
          { label: 'Balance Remaining', value: balance, isDue: balance > 0 }
        ]
      : [])
  ];

  const metaItems = [
    { label: 'RECEIPT NO :', value: p.payment_id },
    { label: 'DATE :', value: formatLongDate(p.payment_date) },
    { label: 'METHOD :', value: methodLabel }
  ];

  const paymentTermsText = order
    ? balance > 0
      ? `An outstanding balance of Rs. ${formatAmount(balance)} remains on order ${orderCode}. Balance payable prior to delivery.`
      : `Order ${orderCode} is settled in full. Thank you for your business!`
    : `Official receipt of payment for ${p.payment_id}. Subject to realisation of cheques and electronic bank transfers.`;

  return (
    <AvenorCommercialLayout
      documentTitle="PAYMENT RECORD"
      brand={brand}
      metaItems={metaItems}
      customerName={person}
      customerCompany={customerCompany}
      customerPhone={order?.customer_phone}
      customerSignatureLabel="Customer Acknowledgement"
      stamp={{ label: 'PAYMENT RECEIVED', tone: 'ok' }}
      notes={p.notes}
    >
      {/* Payment Receipt Acknowledgement Banner */}
      <div className="mb-3.5 flex items-stretch justify-between rounded-[2px] border border-[#d2dbe8] bg-[#f8fbfe] overflow-hidden">
        <div className="grid grid-cols-3 flex-1 p-3 text-[11px] gap-2">
          <div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted block">Payment Type</span>
            <span className="font-extrabold text-[#0a1d44]">{typeLabel}</span>
          </div>
          <div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted block">Payment Method</span>
            <span className="font-extrabold text-[#0a1d44]">{methodLabel}</span>
          </div>
          <div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted block">Reference / Cheque</span>
            <span className="font-extrabold text-ink">{p.reference_number || '—'}</span>
          </div>
          <div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted block">Matched Order</span>
            <span className="font-extrabold text-[#0a1d44]">{orderCode || '—'}</span>
          </div>
          <div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted block">Recorded By</span>
            <span className="font-semibold text-ink">{p.recorded_by_name || 'Finance Staff'}</span>
          </div>
          <div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted block">Status</span>
            <span className="font-bold text-emerald-700">Received & Confirmed</span>
          </div>
        </div>

        {/* Amount Highlight */}
        <div className="flex flex-col justify-center bg-[#0a1d44] px-6 py-3 text-white text-right">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#c6a04a]">Amount Received</p>
          <p className="text-[20px] font-black leading-tight tabular-nums text-white">
            Rs. {formatAmount(p.amount)}
          </p>
        </div>
      </div>

      <AvenorDocTable
        items={items}
        subtotal={order?.subtotal ?? totalOrderAmount}
        discount={order?.discount_amount}
        tax={order?.tax_amount}
        grandTotal={totalOrderAmount}
        extraRows={extraRows}
        minRows={5}
        paymentTerms={paymentTermsText}
        deliveryNotes="Delivery will be dispatched upon full payment clearance and order completion."
      />
    </AvenorCommercialLayout>
  );
}