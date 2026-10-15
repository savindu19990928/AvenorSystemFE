import React from 'react';
import type { Quotation } from '../../types/api';
import type { BrandIdentity } from '../../types/print';
import { formatLongDate, toNumber } from '../../utils/format';
import { AvenorCommercialLayout } from '../print/commercial/AvenorCommercialLayout';
import { AvenorDocTable, type AvenorDocTableItem, type ExtraTotalRow } from '../print/commercial/AvenorDocTable';

export function QuotationDocument({ quotation: q, brand }: { quotation: Quotation; brand: BrandIdentity }) {
  const items: AvenorDocTableItem[] = (q.items ?? []).map((i) => ({
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
  }));

  const discount = toNumber(q.discount_amount);
  const tax = toNumber(q.tax_amount);
  const taxRate = toNumber(q.tax_rate_percent);
  const delivery = toNumber(q.delivery_charges);
  const artwork = toNumber(q.artwork_charges);

  const extraRows: ExtraTotalRow[] = [
    ...(artwork > 0 ? [{ label: 'Artwork / Design', value: artwork }] : []),
    ...(delivery > 0 ? [{ label: 'Delivery Charges', value: delivery }] : [])
  ];

  const metaItems = [
    { label: 'QUOTATION NO :', value: q.quotation_number },
    { label: 'DATE :', value: formatLongDate(q.created_at) },
    { label: 'VALID UNTIL :', value: formatLongDate(q.validity_date) }
  ];

  const stamp =
    q.status === 'APPROVED'
      ? { label: 'APPROVED', tone: 'ok' as const }
      : q.status === 'REJECTED'
        ? { label: 'REJECTED', tone: 'danger' as const }
        : q.status === 'EXPIRED'
          ? { label: 'EXPIRED', tone: 'warning' as const }
          : undefined;

  return (
    <AvenorCommercialLayout
      documentTitle="QUOTATION"
      brand={brand}
      metaItems={metaItems}
      customerName={q.customer_name}
      customerCompany={q.customer_company}
      customerSignatureLabel="Customer Acceptance"
      stamp={stamp}
      notes={q.notes}
    >
      <AvenorDocTable
        items={items}
        subtotal={q.subtotal}
        discount={discount}
        tax={tax}
        taxRatePercent={taxRate}
        grandTotal={q.total_amount}
        extraRows={extraRows}
        minRows={5}
        paymentTerms={q.payment_terms}
        deliveryNotes="Delivery will be arranged islandwide upon production completion."
      />
    </AvenorCommercialLayout>
  );
}