import React from 'react';
import type { OrderDetail } from '../../types/api';
import type { BrandIdentity } from '../../types/print';
import { formatDate, toNumber } from '../../utils/format';
import { DocumentPaper } from '../print/DocumentPaper';
import { PrintParty } from '../print/PrintParty';
import { PrintSignatures } from '../print/PrintSignatures';
import { AvenorCommercialTable, type AvenorLineItem, type ExtraTotalRow } from '../print/commercial/AvenorCommercialTable';

export function OrderDocument({ order, brand }: { order: OrderDetail; brand: BrandIdentity }) {
  const tableItems: AvenorLineItem[] = order.items.map((i) => ({
    id: i.id,
    product_name: i.product_name,
    quantity: i.quantity,
    sizes: i.sizes,
    colours: i.colours,
    fabric_gsm: i.fabric_gsm,
    printing_method: i.printing_method,
    unit_price: i.unit_price,
    total_price: i.total_price
  }));

  const extraRows: ExtraTotalRow[] = [
    ...(toNumber(order.artwork_charges) > 0 ? [{ label: 'Artwork / design', value: order.artwork_charges }] : []),
    ...(toNumber(order.delivery_charges) > 0 ? [{ label: 'Delivery charges', value: order.delivery_charges }] : []),
    ...(toNumber(order.deposit_required) > 0 ? [{ label: 'Deposit required', value: order.deposit_required }] : []),
    ...(toNumber(order.paid_amount) > 0 ? [{ label: 'Paid to date', value: order.paid_amount, deduct: true }] : []),
    ...(toNumber(order.balance_amount) > 0 ? [{ label: 'Balance due', value: order.balance_amount }] : [])
  ];

  return (
    <DocumentPaper
      brand={brand}
      title="Order confirmation"
      number={order.order_id}
      stamp={order.status === 'CANCELLED' ? { label: 'Cancelled', tone: 'danger' } : undefined}
      meta={[
        { label: 'Order date', value: formatDate(order.created_at) },
        { label: 'Expected delivery', value: formatDate(order.expected_delivery_date) },
        { label: 'Prepared by', value: order.created_by_name ?? '' },
        { label: 'Brand', value: order.brand_name }
      ]}
    >
      <div className="grid grid-cols-2 gap-8">
        <PrintParty
          label="Customer"
          name={order.customer_company || order.customer_name}
          lines={[order.customer_company ? order.customer_name : '', order.customer_phone]}
        />
        <PrintParty label="Deliver to" name={order.delivery_address || '—'} lines={[]} />
      </div>

      {/* Commercial Table matching Quotation format */}
      <AvenorCommercialTable
        items={tableItems}
        subtotal={order.subtotal ?? order.total_amount}
        discount={order.discount_amount}
        tax={order.tax_amount}
        total={order.total_amount}
        totalLabel="TOTAL COST"
        currencyPrefix="LKR"
        extraRows={extraRows}
        minRows={5}
      />

      {order.printing_embroidery_requirements && (
        <section className="rounded border border-[#d8e4f0] bg-[#f8fbfe] p-3 text-[11px]">
          <p className="font-bold text-[#0b2545] uppercase tracking-wide text-[10.5px]">Printing / embroidery requirements</p>
          <p className="mt-1 text-ink">{order.printing_embroidery_requirements}</p>
        </section>
      )}

      <PrintSignatures labels={['Customer confirmation', `For ${brand.name}`]} />
    </DocumentPaper>
  );
}