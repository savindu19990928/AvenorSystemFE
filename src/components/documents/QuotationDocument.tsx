import React from 'react';
import type { Quotation } from '../../types/api';
import type { BrandIdentity, TotalRow } from '../../types/print';
import { formatDate, toNumber, toPrintLine } from '../../utils/format';
import { DocumentPaper } from '../print/DocumentPaper';
import { PrintItemsTable } from '../print/PrintItemsTable';
import { PrintTotals } from '../print/PrintTotals';
import { PrintParty } from '../print/PrintParty';
import { PrintSignatures } from '../print/PrintSignatures';

export function QuotationDocument({ quotation: q, brand }: {quotation: Quotation;brand: BrandIdentity;}) {
  const totals: TotalRow[] = [
  { label: 'Subtotal', value: q.subtotal },
  ...(toNumber(q.artwork_charges) ? [{ label: 'Artwork / design', value: q.artwork_charges }] : []),
  ...(toNumber(q.delivery_charges) ? [{ label: 'Delivery', value: q.delivery_charges }] : []),
  ...(toNumber(q.discount_amount) ? [{ label: 'Discount', value: q.discount_amount, kind: 'deduct' as const }] : []),
  ...(toNumber(q.tax_amount) ? [{ label: `Tax (${toNumber(q.tax_rate_percent)}%)`, value: q.tax_amount }] : []),
  { label: 'Total', value: q.total_amount, kind: 'total' }];


  return (
    <DocumentPaper
      brand={brand}
      title="Quotation"
      number={q.quotation_number}
      meta={[
      { label: 'Date', value: formatDate(q.created_at) },
      { label: 'Valid until', value: formatDate(q.validity_date) },
      { label: 'Prepared by', value: q.created_by_name ?? '' },
      { label: 'Brand', value: q.brand_name }]
      }>
      
      <div className="grid grid-cols-2 gap-8">
        <PrintParty label="Prepared for" name={q.customer_company || q.customer_name} lines={[q.customer_company ? q.customer_name : '']} />
        <PrintParty label="Payment terms" name={q.payment_terms || 'As agreed'} lines={[]} />
      </div>
      <PrintItemsTable items={(q.items ?? []).map(toPrintLine)} />
      <PrintTotals rows={totals} />
      {q.notes &&
      <section>
          <p className="text-[11px] text-faint">Notes</p>
          <p className="mt-0.5 whitespace-pre-line">{q.notes}</p>
        </section>
      }
      <p className="text-xs text-muted">
        Prices are valid until {formatDate(q.validity_date)}. Production begins once the quotation is accepted and the deposit is received.
      </p>
      <PrintSignatures labels={['Customer acceptance', `For ${brand.name}`]} />
    </DocumentPaper>);

}