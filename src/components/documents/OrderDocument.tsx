import React from 'react';
import type { OrderDetail } from '../../types/api';
import type { BrandIdentity, TotalRow } from '../../types/print';
import { formatDate, toNumber, toPrintLine } from '../../utils/format';
import { DocumentPaper } from '../print/DocumentPaper';
import { PrintItemsTable } from '../print/PrintItemsTable';
import { PrintTotals } from '../print/PrintTotals';
import { PrintParty } from '../print/PrintParty';
import { PrintSignatures } from '../print/PrintSignatures';

export function OrderDocument({ order, brand }: {order: OrderDetail;brand: BrandIdentity;}) {
  const totals: TotalRow[] = [
  ...(order.subtotal !== undefined ? [{ label: 'Subtotal', value: order.subtotal }] : []),
  ...(toNumber(order.artwork_charges) ? [{ label: 'Artwork / design', value: order.artwork_charges }] : []),
  ...(toNumber(order.delivery_charges) ? [{ label: 'Delivery', value: order.delivery_charges }] : []),
  ...(toNumber(order.discount_amount) ? [{ label: 'Discount', value: order.discount_amount, kind: 'deduct' as const }] : []),
  ...(toNumber(order.tax_amount) ? [{ label: 'Tax', value: order.tax_amount }] : []),
  { label: 'Order total', value: order.total_amount, kind: 'total' },
  ...(toNumber(order.deposit_required) ? [{ label: 'Deposit required', value: order.deposit_required }] : []),
  { label: 'Paid to date', value: order.paid_amount, kind: 'deduct' },
  { label: 'Balance', value: order.balance_amount, kind: 'due' }];


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
      { label: 'Brand', value: order.brand_name }]
      }>
      
      <div className="grid grid-cols-2 gap-8">
        <PrintParty
          label="Customer"
          name={order.customer_company || order.customer_name}
          lines={[order.customer_company ? order.customer_name : '', order.customer_phone]} />
        
        <PrintParty label="Deliver to" name={order.delivery_address || '—'} lines={[]} />
      </div>
      <PrintItemsTable items={order.items.map(toPrintLine)} />
      <PrintTotals rows={totals} />
      {order.printing_embroidery_requirements &&
      <section>
          <p className="text-[11px] text-faint">Printing / embroidery requirements</p>
          <p className="mt-0.5">{order.printing_embroidery_requirements}</p>
        </section>
      }
      <PrintSignatures labels={['Customer confirmation', `For ${brand.name}`]} />
    </DocumentPaper>);

}