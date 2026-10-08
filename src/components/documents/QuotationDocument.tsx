import React from 'react';
import type { Quotation } from '../../types/api';
import type { BrandIdentity, DocNote, TotalRow } from '../../types/print';
import { company } from '../../data/company';
import { formatAmount, formatLongDate, formatNumber, joinList, toCommercialLine, toNumber } from '../../utils/format';
import { CommercialPaper } from '../print/commercial/CommercialPaper';
import { PartyPanels } from '../print/commercial/PartyPanels';
import { OrderDetailsTable } from '../print/commercial/OrderDetailsTable';
import { SummaryPanel } from '../print/commercial/SummaryPanel';
import { NotesGrid } from '../print/commercial/NotesGrid';
import { CommercialSignatures } from '../print/commercial/CommercialSignatures';

export function QuotationDocument({ quotation: q, brand }: {quotation: Quotation;brand: BrandIdentity;}) {
  const items = q.items ?? [];
  const discount = toNumber(q.discount_amount);
  const tax = toNumber(q.tax_amount);
  const delivery = toNumber(q.delivery_charges);
  const unconfirmed = !discount && !tax;
  const companyName = (brand.company || company.name).toUpperCase();

  const sameQty = items.length > 1 && new Set(items.map((i) => i.quantity)).size === 1;
  const qtyBasis = sameQty ? `${formatNumber(items[0].quantity)} units per style` : 'the quantities listed for each style';

  const rows: TotalRow[] = [
  { label: 'Subtotal', value: q.subtotal },
  ...(toNumber(q.artwork_charges) ? [{ label: 'Artwork / design', value: q.artwork_charges }] : []),
  ...(delivery ? [{ label: 'Delivery', value: q.delivery_charges }] : []),
  ...(unconfirmed ?
  [{ label: 'Discount / Tax', value: undefined, text: 'To confirm' }] :
  [
  ...(discount ? [{ label: 'Discount', value: q.discount_amount, kind: 'deduct' as const }] : []),
  ...(tax ? [{ label: `Tax (${toNumber(q.tax_rate_percent)}%)`, value: q.tax_amount }] : [])]),

  { label: unconfirmed ? 'Est. total*' : 'Total', value: q.total_amount, kind: 'total' }];


  const excluded = [!discount && 'any discount', !tax && 'applicable taxes', !delivery && 'delivery charges'].filter((s): s is string => !!s);
  const basis = [
  `Calculated at ${qtyBasis}, as listed. ${excluded.length ? `Total excludes ${joinList(excluded)} until confirmed.` : 'Total includes all confirmed charges, discounts and taxes.'}`,
  'Final size breakdown and production specifications to be approved before bulk production.',
  ...(q.notes ? [q.notes] : [])];


  const adjustments = [discount && `a discount of LKR ${formatAmount(discount)}`, tax && `tax of LKR ${formatAmount(tax)} (${toNumber(q.tax_rate_percent)}%)`].filter(
    (s): s is string => !!s
  );

  const notes: DocNote[] = [
  { label: 'Branding & specifications', text: `${brand.name} label artwork, placement and final garment specifications should be approved before bulk production.` },
  {
    label: 'Lead time & delivery',
    text: delivery ?
    `Delivery charges of LKR ${formatAmount(delivery)} are included. Production lead time is confirmed once final specifications and quantities are approved.` :
    'Production lead time, delivery method and any shipping charges are to be confirmed after final specifications and quantities are approved.'
  },
  { label: 'Payment terms', text: q.payment_terms || 'Payment schedule to be agreed in writing before production begins.' },
  {
    label: 'Taxes & discounts',
    text: adjustments.length ?
    `This quotation includes ${joinList(adjustments)}.` :
    'No discount or tax amount has been applied to this quotation; these must be confirmed before the final payable amount is accepted.'
  }];


  const footnote = unconfirmed ?
  `* Estimated total is based on ${qtyBasis} and is before any confirmed discounts, taxes or delivery charges. Final acceptance is subject to written confirmation of the quantities and specifications.` :
  `Prices are valid until ${formatLongDate(q.validity_date)}. Production begins once the quotation is accepted and the deposit is received.`;

  return (
    <CommercialPaper
      brand={brand}
      title="Quotation"
      subtitle="Custom apparel order proposal"
      reference={q.quotation_number}
      dateLabel="Quotation date"
      dateValue={formatLongDate(q.created_at)}
      dateNotes={[`Valid until ${formatLongDate(q.validity_date)}`, `Currency: ${company.currency}`]}>
      
      <PartyPanels partyLabel="Prepared for" partyName={q.customer_name || q.customer_company} partyLines={[q.customer_name ? q.customer_company : '']} brand={brand} />
      <OrderDetailsTable lines={items.map(toCommercialLine)} />
      <SummaryPanel label="Pricing basis" paragraphs={basis} rows={rows} />
      <NotesGrid title="Production & fulfilment notes" notes={notes} />
      <CommercialSignatures footnote={footnote} labels={[`For ${companyName}`, 'Customer acceptance']} />
    </CommercialPaper>);

}