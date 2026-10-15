import React from 'react';
import type { Quotation } from '../../types/api';
import type { BrandIdentity } from '../../types/print';
import { company } from '../../data/company';
import { formatLongDate, toNumber } from '../../utils/format';
import { CompanyLogo } from '../print/commercial/CompanyLogo';
import { AvenorCommercialTable } from '../print/commercial/AvenorCommercialTable';

function formatDotDate(val?: string | null): string {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}. ${month}. ${year}`;
}

export function QuotationDocument({ quotation: q, brand }: { quotation: Quotation; brand: BrandIdentity }) {
  const items = q.items ?? [];
  const discount = toNumber(q.discount_amount);
  const tax = toNumber(q.tax_amount);
  const taxRate = toNumber(q.tax_rate_percent);
  const delivery = toNumber(q.delivery_charges);
  const artwork = toNumber(q.artwork_charges);
  const companyName = (brand.company || company.name).toUpperCase();

  const extraRows = [
    ...(artwork > 0 ? [{ label: 'Artwork / Design', value: artwork }] : []),
    ...(delivery > 0 ? [{ label: 'Delivery charges', value: delivery }] : [])
  ];

  return (
    <div
      className="doc-paper relative flex min-h-[1123px] w-[794px] flex-col overflow-hidden bg-white px-12 pt-8 pb-10 text-[12px] leading-snug text-ink select-none"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* 1. Top Horizontal Blue Accent Bar (Matching Reference Image) */}
      <div className="h-[2.5px] w-full bg-[#005a9c]" />

      {/* 2. Header: Logo on Left + Company Details beside it */}
      <header className="mt-6 flex items-start gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded bg-[#0a1d44] p-1.5 shadow-sm">
          {brand.logo ? (
            <img src={brand.logo} alt={brand.name} className="max-h-full max-w-full object-contain" />
          ) : (
            <CompanyLogo size={72} label={companyName} />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-0.5 text-[12px] leading-tight text-ink">
          <h1 className="text-[17px] font-extrabold uppercase tracking-wide text-[#0b2545]">
            {brand.company || company.name}
          </h1>
          <p className="font-medium text-ink">{company.address}</p>
          <p className="font-bold text-ink">{company.phone}</p>
          <p className="font-bold text-ink">{company.email}</p>
        </div>
      </header>

      {/* 3. Document Title & Date */}
      <div className="mt-7">
        <h2 className="text-[16px] font-bold text-ink">Quotation</h2>
        <div className="mt-0.5 flex items-center gap-4 text-[12px] text-ink font-medium">
          <p>Date: {formatDotDate(q.created_at)}</p>
          {q.quotation_number && (
            <p className="text-muted font-normal">No: <span className="font-semibold text-ink">{q.quotation_number}</span></p>
          )}
        </div>
      </div>

      {/* 4. BILL TO Section */}
      <div className="mt-6">
        <h3 className="text-[12.5px] font-extrabold uppercase tracking-wider text-ink">BILL TO</h3>
        <div className="mt-1 space-y-0.5 text-[12px] leading-normal text-ink">
          <p className="font-medium text-ink">
            {q.customer_name || q.customer_company || 'Valued Customer'}
          </p>
          {q.customer_company && q.customer_company !== q.customer_name && (
            <p className="text-muted">{q.customer_company}</p>
          )}
        </div>
      </div>

      {/* 5. Quotation Table (ITEM DESCRIPTION & AMOUNT with Alternating Rows and TOTAL COST Bar) */}
      <div className="mt-6">
        <AvenorCommercialTable
          items={items.map((i) => ({
            id: i.id,
            product_name: i.product_name,
            quantity: i.quantity,
            sizes: i.sizes,
            size: i.size,
            colours: i.colours,
            colour: i.colour,
            fabric_gsm: i.fabric_gsm,
            printing_method: i.printing_method,
            unit_price: i.unit_price,
            total_price: i.total_price
          }))}
          subtotal={q.subtotal}
          discount={discount}
          tax={tax}
          taxRate={taxRate}
          total={q.total_amount}
          totalLabel="TOTAL COST"
          currencyPrefix="LKR"
          extraRows={extraRows}
          minRows={5}
        />
      </div>

      {/* 6. Validity, Payment Terms & Special Notes */}
      <div className="mt-6 space-y-1 text-[11px] leading-relaxed text-muted">
        <p className="italic">
          * Prices are valid until <strong className="font-semibold text-ink">{formatLongDate(q.validity_date)}</strong>.
          {q.payment_terms ? ` Payment terms: ${q.payment_terms}.` : ' Payment schedule to be agreed before bulk production begins.'}
        </p>
        {q.notes && (
          <p className="text-[10.5px]">
            <strong className="font-semibold text-ink">Notes / Instructions:</strong> {q.notes}
          </p>
        )}
      </div>

      <div className="min-h-[24px] flex-1" />

      {/* 7. Signatures */}
      <div className="print-avoid-break mb-8 flex items-end justify-between px-2">
        <div className="w-[240px] text-center">
          <div className="w-full border-b border-ink" />
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-ink">
            Authorized Signature
          </p>
          <p className="text-[10px] text-muted">{brand.company || company.legalName}</p>
        </div>

        <div className="w-[240px] text-center">
          <div className="w-full border-b border-ink" />
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-ink">
            Customer Acceptance
          </p>
          <p className="text-[10px] text-muted">{q.customer_name || 'Customer'}</p>
        </div>
      </div>

      {/* 8. Footer (Matching Reference Image) */}
      <footer className="mt-auto border-t border-[#d8e4f0] pt-3 text-[11px] text-ink font-medium">
        <a
          href={`https://${company.website}`}
          target="_blank"
          rel="noreferrer"
          className="text-[#005a9c] hover:underline"
        >
          {company.website}
        </a>
      </footer>
    </div>
  );
}