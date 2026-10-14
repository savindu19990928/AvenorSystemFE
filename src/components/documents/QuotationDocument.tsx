import React from 'react';
import type { Quotation } from '../../types/api';
import type { BrandIdentity } from '../../types/print';
import { company } from '../../data/company';
import { formatAmount, formatLongDate, formatNumber, itemVariant, toNumber } from '../../utils/format';
import { cx } from '../../utils/styles';
import { CompanyLogo } from '../print/commercial/CompanyLogo';

export function QuotationDocument({ quotation: q, brand }: { quotation: Quotation; brand: BrandIdentity }) {
  const items = q.items ?? [];
  const discount = toNumber(q.discount_amount);
  const tax = toNumber(q.tax_amount);
  const taxRate = toNumber(q.tax_rate_percent);
  const delivery = toNumber(q.delivery_charges);
  const artwork = toNumber(q.artwork_charges);
  const unconfirmed = !discount && !tax;
  const companyName = (brand.company || company.name).toUpperCase();

  // Additional charges net calculation (Artwork + Delivery - Discount)
  const additionalNet = artwork + delivery - discount;
  const hasAdditional = artwork > 0 || delivery > 0 || discount > 0;
  const additionalSign = additionalNet < 0 ? '−' : '';
  const additionalNotesList: string[] = [];
  if (artwork > 0) additionalNotesList.push('Artwork');
  if (delivery > 0) additionalNotesList.push('Delivery');
  if (discount > 0) additionalNotesList.push('Discount incl.');
  const additionalNotes = additionalNotesList.join(', ');

  return (
    <div
      className="doc-paper relative flex min-h-[1123px] w-[794px] flex-col overflow-hidden bg-white text-[12px] leading-snug text-ink select-none"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* ============================================================== */}
      {/* 1. TOP GEOMETRIC HEADER (Matching Reference Image)            */}
      {/* ============================================================== */}
      <header className="relative h-[112px] w-full shrink-0 select-none bg-white">
        <svg
          viewBox="0 0 794 112"
          className="block h-full w-full"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top horizontal strip across full width: Deep Navy with Gold bottom trim */}
          <rect x="0" y="0" width="794" height="11" fill="#0a1d44" />
          <rect x="0" y="9" width="794" height="2" fill="#d4af37" />

          {/* Left Polygon: Deep Navy banner slanting down-left on the right */}
          <polygon points="0,11 462,11 398,112 0,112" fill="#0a1d44" />

          {/* Slanted Gold Accent Ribbon */}
          <polygon points="470,11 486,11 422,112 406,112" fill="#d4af37" />

          {/* Right Polygon: Deep Navy banner with angled left edge */}
          <polygon points="496,11 794,11 794,112 432,112" fill="#0a1d44" />

          {/* Subtle gold line along top border of right banner */}
          <line x1="496" y1="12" x2="794" y2="12" stroke="#d4af37" strokeWidth="2" />
        </svg>

        {/* Content Overlay inside Header */}
        <div className="pointer-events-none absolute inset-0 top-[11px] flex items-center justify-between px-8 text-white">
          {/* Left: Company Logo + Company Name & Tagline */}
          <div className="flex max-w-[390px] items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-white/10 p-1 border border-white/20">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="max-h-full max-w-full object-contain drop-shadow" />
              ) : (
                <CompanyLogo size={40} label={companyName} />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[16px] font-extrabold uppercase leading-tight tracking-wider text-white drop-shadow-sm">
                {brand.company || company.name}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#f4c76f]">
                {company.tagline.join('  |  ')}
              </p>
            </div>
          </div>

          {/* Right: QUOTATION Header Title */}
          <div className="pr-5">
            <h1 className="text-[29px] font-extrabold uppercase tracking-[0.24em] text-white drop-shadow-md">
              QUOTATION
            </h1>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. QUOTATION NO. & DATE OF ISSUE (Underline Format)            */}
      {/* ============================================================== */}
      <div className="mt-7 flex items-center justify-between px-12">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-bold text-ink">Quotation No.</span>
          <div className="inline-block min-w-[200px] border-b-2 border-ink px-3 pb-0.5 text-center">
            <span className="text-[13.5px] font-bold tracking-wider text-doc-navy">{q.quotation_number}</span>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-bold text-ink">Date of Issue:</span>
          <div className="inline-block min-w-[200px] border-b-2 border-ink px-3 pb-0.5 text-center">
            <span className="text-[12.5px] font-semibold text-ink">{formatLongDate(q.created_at)}</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BILL FROM & BILL TO                                         */}
      {/* ============================================================== */}
      <div className="mt-7 grid grid-cols-2 gap-12 px-12">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-wider text-ink">Bill From:</p>
          <div className="mt-2 space-y-0.5 text-[12px] leading-relaxed text-ink">
            <p className="text-[13px] font-bold text-ink">{brand.company || company.legalName}</p>
            <p className="text-muted">{company.address}</p>
            <p className="mt-1 text-[11px] text-muted">
              {company.phone}  |  {company.email}  |  {company.websiteShort}
            </p>
          </div>
        </div>

        <div>
          <p className="text-[13px] font-bold uppercase tracking-wider text-ink">Bill To:</p>
          <div className="mt-2 space-y-0.5 text-[12px] leading-relaxed text-ink">
            <p className="text-[13px] font-bold text-ink">{q.customer_name || q.customer_company || 'Valued Customer'}</p>
            {q.customer_name && q.customer_company && (
              <p className="text-muted">{q.customer_company}</p>
            )}
            <p className="mt-1 text-[11px] text-muted">
              Project Brand: <span className="font-semibold text-doc-navy">{brand.name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. PROJECT DETAILS TABLE                                       */}
      {/* ============================================================== */}
      <div className="mt-7 px-12">
        <h2 className="text-[13.5px] font-bold uppercase tracking-wider text-ink">Project Details</h2>
        <div className="mt-2.5 overflow-hidden border border-[#d2dbe8]">
          <table className="w-full border-collapse text-[11.5px]">
            <thead>
              <tr className="bg-doc-navy text-[10.5px] font-bold uppercase tracking-wider text-white">
                <th className="w-[10%] border-r border-white/20 px-2.5 py-2.5 text-center">Item No.</th>
                <th className="w-[45%] border-r border-white/20 px-3 py-2.5 text-left">Task Description</th>
                <th className="w-[15%] border-r border-white/20 px-2.5 py-2.5 text-center">Estimated Hours</th>
                <th className="w-[15%] border-r border-white/20 px-2.5 py-2.5 text-right">Hourly Rate</th>
                <th className="w-[15%] px-3 py-2.5 text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const isEven = idx % 2 === 0;
                const { sizes, colours } = itemVariant(item);
                const specParts = [
                  colours && `Colours: ${colours}`,
                  sizes && `Sizes: ${sizes}`,
                  [item.fabric_gsm, item.printing_method].filter(Boolean).join(' · ')
                ].filter(Boolean);

                return (
                  <tr
                    key={item.id ?? idx}
                    className={cx(
                      'print-avoid-break align-top border-b border-white',
                      isEven ? 'bg-[#edf3f9]' : 'bg-[#e2ecf6]'
                    )}
                  >
                    <td className="border-r border-white px-2.5 py-2.5 text-center font-medium tabular-nums text-ink">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="border-r border-white px-3 py-2.5">
                      <p className="text-[12px] font-bold text-ink">{item.product_name}</p>
                      {specParts.length > 0 && (
                        <p className="mt-0.5 text-[10.5px] leading-tight text-muted">
                          {specParts.join('  |  ')}
                        </p>
                      )}
                    </td>
                    <td className="border-r border-white px-2.5 py-2.5 text-center font-medium tabular-nums text-ink">
                      {formatNumber(item.quantity)} pcs
                    </td>
                    <td className="border-r border-white px-2.5 py-2.5 text-right tabular-nums text-ink">
                      {formatAmount(item.unit_price)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold tabular-nums text-doc-navy">
                      {formatAmount(item.total_price)}
                    </td>
                  </tr>
                );
              })}

              {/* Template Filler Rows (matching the reference image 5-row look) */}
              {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, fIdx) => {
                const rowIdx = items.length + fIdx;
                const isEven = rowIdx % 2 === 0;
                return (
                  <tr
                    key={`filler-${fIdx}`}
                    className={cx('h-[36px] border-b border-white', isEven ? 'bg-[#edf3f9]' : 'bg-[#e2ecf6]')}
                  >
                    <td className="border-r border-white">&nbsp;</td>
                    <td className="border-r border-white">&nbsp;</td>
                    <td className="border-r border-white">&nbsp;</td>
                    <td className="border-r border-white">&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. TOTALS PANEL & DECORATIVE DIAGONAL STRIPES HATCHING BOX    */}
      {/* ============================================================== */}
      <div className="print-avoid-break mt-3.5 flex items-stretch justify-between gap-6 px-12">
        {/* Left: Diagonal Hatching Pattern Box (from image) */}
        <div
          className="w-[42%] min-h-[124px] rounded-sm border border-[#d2dbe8]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #0a1d44 0, #0a1d44 2px, transparent 2px, transparent 7px)',
            opacity: 0.85
          }}
          aria-hidden="true"
        />

        {/* Right: Summary / Totals Breakdown Table */}
        <div className="flex w-[58%] flex-col justify-between overflow-hidden border border-[#d2dbe8]">
          {/* Subtotal */}
          <div className="flex items-center justify-between bg-doc-navy px-3.5 py-2 text-white">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Subtotal</span>
            <span className="text-[12px] font-bold tabular-nums">LKR {formatAmount(q.subtotal)}</span>
          </div>

          {/* Taxes (if applicable) */}
          <div className="flex items-center justify-between border-b border-white bg-[#edf3f9] px-3.5 py-1.5 text-[11px]">
            <span className="font-medium text-ink">
              Taxes {taxRate ? `(${taxRate}%)` : '(if applicable)'}
            </span>
            <span className="font-medium tabular-nums text-ink">
              {tax ? `LKR ${formatAmount(tax)}` : unconfirmed ? 'To confirm' : '0.00'}
            </span>
          </div>

          {/* Additional Charges */}
          <div className="flex items-center justify-between border-b border-white bg-[#edf3f9] px-3.5 py-1.5 text-[11px]">
            <span className="font-medium text-ink">
              Additional Charges {additionalNotes ? `(${additionalNotes})` : ''}
            </span>
            <span className="font-medium tabular-nums text-ink">
              {hasAdditional ? `${additionalSign}LKR ${formatAmount(Math.abs(additionalNet))}` : '0.00'}
            </span>
          </div>

          {/* Grand Total */}
          <div className="flex items-center justify-between border-t-2 border-doc-gold bg-[#0a1d44] px-3.5 py-2.5 text-white">
            <span className="text-[13px] font-extrabold uppercase tracking-wider text-[#f4c76f]">Grand Total</span>
            <span className="text-[15px] font-extrabold tabular-nums text-white">
              LKR {formatAmount(q.total_amount)}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. VALIDITY & SPECIAL NOTES                                    */}
      {/* ============================================================== */}
      <div className="mt-5 px-12 text-[11px] leading-relaxed text-muted">
        <p className="italic">
          * Prices are valid until <strong className="font-semibold text-ink">{formatLongDate(q.validity_date)}</strong>.
          {q.payment_terms ? ` Payment terms: ${q.payment_terms}.` : ' Payment schedule to be agreed before bulk production begins.'}
        </p>
        {q.notes && (
          <p className="mt-1 text-[10.5px]">
            <strong className="font-semibold text-ink">Notes / Instructions:</strong> {q.notes}
          </p>
        )}
      </div>

      <div className="min-h-[24px] flex-1" />

      {/* ============================================================== */}
      {/* 7. SIGNATURES (Underline Style matching image)                */}
      {/* ============================================================== */}
      <div className="print-avoid-break mb-12 flex items-end justify-between px-12">
        {/* Left: Authorized Signature */}
        <div className="w-[260px] text-center">
          <div className="w-full border-b-2 border-ink" />
          <p className="mt-2 text-[11.5px] font-bold uppercase tracking-wider text-ink">
            Authorized Signature
          </p>
          <p className="mt-0.5 text-[10.5px] text-muted">
            {brand.company || company.legalName}
          </p>
        </div>

        {/* Right: Customer Acceptance */}
        <div className="w-[260px] text-center">
          <div className="w-full border-b-2 border-ink" />
          <p className="mt-2 text-[11.5px] font-bold uppercase tracking-wider text-ink">
            Customer Acceptance
          </p>
          <p className="mt-0.5 text-[10.5px] text-muted">
            {q.customer_name || '[Insert Name & Title]'}
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 8. BOTTOM GEOMETRIC ACCENT (Matching Top Header Angle)        */}
      {/* ============================================================== */}
      <div className="pointer-events-none absolute bottom-0 right-0 h-[34px] w-[260px] overflow-hidden">
        <svg viewBox="0 0 260 34" className="block h-full w-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          {/* Angled Navy Polygon */}
          <polygon points="56,34 98,0 260,0 260,34" fill="#0a1d44" />
          {/* Angled Gold Wedge */}
          <polygon points="36,34 78,0 90,0 48,34" fill="#d4af37" />
        </svg>
      </div>
    </div>
  );
}