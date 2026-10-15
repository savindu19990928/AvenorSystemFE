import React from 'react';
import type { Quotation } from '../../types/api';
import type { BrandIdentity } from '../../types/print';
import { formatAmount, formatLongDate, formatNumber, itemVariant, resolveDeliveryType, sizeRange, toNumber } from '../../utils/format';
import { cx } from '../../utils/styles';
import type { AvenorDocTableItem, ExtraTotalRow } from '../print/commercial/AvenorDocTable';

// 4 pages extracted from Zevora_Quotation.docx
import page1Cover from '../../assets/zevora-template/image3.png';
import page2Catalog from '../../assets/zevora-template/image2.png';
import page3Quotation from '../../assets/zevora-template/image4.png';
import page4Contact from '../../assets/zevora-template/image1.png';

export interface ZevoraQuotationDocumentProps {
  quotation: Quotation;
  brand: BrandIdentity;
}

export function ZevoraQuotationDocument({ quotation: q }: ZevoraQuotationDocumentProps) {
  const deliveryType = resolveDeliveryType(
    (q as any).delivery_location,
    (q as any).delivery_address,
    (q as any).delivery_type,
    q.notes
  );

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
    total_price: i.total_price,
    description: i.description
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

  // Up to 3 rows minimum so table remains compact on the 2-slides-per-A4 sheet
  const fillerCount = items.length >= 3 ? 0 : Math.max(0, 3 - items.length);

  return (
    <div
      className="zevora-quotation-doc flex flex-col gap-8 print:gap-0 print:block text-ink select-none"
      data-orientation="portrait"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* ============================================================== */}
      {/* SHEET 1 (A4 PORTRAIT): COVER SLIDE + CATALOG SLIDE             */}
      {/* ============================================================== */}
      <div
        data-doc-page="1"
        data-orientation="portrait"
        className="doc-page relative flex flex-col p-0 m-0 overflow-hidden bg-white shadow-pop print:shadow-none print:break-after-page"
        style={{ width: '210mm', height: '297mm', maxWidth: '210mm', maxHeight: '297mm', boxSizing: 'border-box' }}
      >
        {/* TOP: SLIDE 1 (COVER PROPOSAL) */}
        <div
          className="relative w-full overflow-hidden shrink-0"
          style={{ height: '148.5mm', width: '210mm' }}
        >
          <img
            src={page1Cover}
            alt="Zevora Quotation Proposal"
            className="absolute inset-0 h-full w-full object-fill pointer-events-none select-none"
          />

          {/* Client Info Overlay inside 'QUOTATION PREPARED FOR' box */}
          <div
            className="absolute z-10 flex flex-col justify-center px-3 py-1"
            style={{
              left: '54.6%',
              top: '81.5%',
              width: '40.2%',
              height: '11.0%'
            }}
          >
            <div className="flex items-baseline justify-between gap-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-white truncate drop-shadow-xs">
                {q.customer_name || q.customer_company || 'Valued Client'}
              </p>
              <span className="text-[9px] font-extrabold text-[#c6a04a] tracking-wider shrink-0">
                {q.quotation_number}
              </span>
            </div>
            {q.customer_company && q.customer_name && q.customer_company !== q.customer_name && (
              <p className="text-[8.5px] font-semibold text-white/80 truncate">
                {q.customer_company}
              </p>
            )}
            <div className="mt-0.5 flex items-center justify-between text-[7.5px] text-white/75 font-medium border-t border-white/15 pt-0.5">
              <span>
                Date: <strong className="text-white font-semibold">{formatLongDate(q.created_at)}</strong>
              </span>
              <span>
                Valid: <strong className="text-white font-semibold">{formatLongDate(q.validity_date)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM: SLIDE 2 (ABOUT / PRODUCTS CATALOG) */}
        <div
          className="relative w-full overflow-hidden shrink-0"
          style={{ height: '148.5mm', width: '210mm' }}
        >
          <img
            src={page2Catalog}
            alt="About Zevora Custom & Products"
            className="absolute inset-0 h-full w-full object-fill pointer-events-none select-none"
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* SHEET 2 (A4 PORTRAIT): QUOTATION TABLE + CLOSING SLIDE         */}
      {/* ============================================================== */}
      <div
        data-doc-page="2"
        data-orientation="portrait"
        className="doc-page relative flex flex-col p-0 m-0 overflow-hidden bg-white shadow-pop print:shadow-none"
        style={{ width: '210mm', height: '297mm', maxWidth: '210mm', maxHeight: '297mm', boxSizing: 'border-box' }}
      >
        {/* TOP: SLIDE 3 (QUOTATION TABLE & DETAILS) */}
        <div
          className="relative w-full overflow-hidden shrink-0 bg-white"
          style={{ height: '148.5mm', width: '210mm' }}
        >
          {/* Template Background Image: image4.png */}
          <img
            src={page3Quotation}
            alt="Zevora Quotation Table Template"
            className="absolute inset-0 h-full w-full object-fill pointer-events-none select-none"
          />

          {/* Middle White Area Overlay */}
          <div
            className="absolute z-10 flex flex-col justify-between"
            style={{
              left: '4.5%',
              top: '15.0%',
              width: '91%',
              height: '63.5%'
            }}
          >
            {/* 1. METADATA ROW (From quotation_table.docx Table 0) */}
            <div className="flex items-center justify-between gap-2 border-b border-[#0a1d44]/20 pb-1 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[7.5px] font-black uppercase tracking-widest text-[#f6c87a] bg-[#0a1d44] px-1.5 py-0.5 rounded-xs shrink-0">
                  PREPARED FOR
                </span>
                <span className="text-[9.5px] font-bold text-ink truncate">
                  {q.customer_name || q.customer_company || 'Valued Customer'}
                  {q.customer_company && q.customer_name && q.customer_company !== q.customer_name && (
                    <span className="text-muted font-normal text-[8.5px] ml-1">({q.customer_company})</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-[8.5px] font-bold text-ink uppercase tracking-wide">QUOTATION NO :</span>
                  <span className="border-b-2 border-[#0a1d44] px-0.5 text-[9px] font-extrabold text-[#0a1d44] tracking-wide">
                    {q.quotation_number}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[8.5px] font-bold text-ink uppercase tracking-wide">DATE :</span>
                  <span className="border-b-2 border-[#0a1d44] px-0.5 text-[8.5px] font-bold text-ink">
                    {formatLongDate(q.created_at)}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[8.5px] font-bold text-ink uppercase tracking-wide">VALID UNTIL :</span>
                  <span className="border-b-2 border-[#0a1d44] px-0.5 text-[8.5px] font-bold text-ink">
                    {formatLongDate(q.validity_date)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. MAIN APPAREL TABLE (From quotation_table.docx Table 1) */}
            <div className="overflow-hidden border border-[#0a1d44]/30 rounded-[2px] shadow-2xs my-0.5 bg-white shrink-0">
              <table className="w-full table-fixed border-collapse text-[8px]">
                <thead>
                  <tr className="bg-[#0a1d44] text-[7.5px] font-bold uppercase tracking-wider text-white">
                    <th className="w-[7%] border-r border-white/20 px-1 py-1 text-center">ITEMS</th>
                    <th className="w-[37%] border-r border-white/20 px-2 py-1 text-left">DESCRIPTION</th>
                    <th className="w-[15%] border-r border-white/20 px-1 py-1 text-center">SIZE RANGE</th>
                    <th className="w-[11%] border-r border-white/20 px-1 py-1 text-center">QTY</th>
                    <th className="w-[14%] border-r border-white/20 px-1.5 py-1 text-right">UNIT PRICE</th>
                    <th className="w-[16%] px-1.5 py-1 text-right">TOTAL (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const isEven = idx % 2 === 0;
                    const { sizes, colours } = itemVariant(item);
                    const sizeList = item.sizes?.length
                      ? item.sizes
                      : item.size
                        ? item.size.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)
                        : [];
                    const calculatedSizeRange = sizeRange(sizeList) || sizes || '—';

                    const specParts = [
                      colours && `Colours: ${colours}`,
                      [item.fabric_gsm, item.printing_method].filter(Boolean).join(' · '),
                      item.description && item.description !== item.product_name ? item.description : '',
                      ...(item.details ?? [])
                    ].filter(Boolean);

                    const rowQty = item.quantity !== undefined ? Number(item.quantity) : 0;
                    const rowUnitPrice = item.unit_price !== undefined ? toNumber(item.unit_price) : 0;
                    const rowTotalPrice =
                      item.total_price !== undefined && toNumber(item.total_price) > 0
                        ? toNumber(item.total_price)
                        : rowQty * rowUnitPrice;

                    return (
                      <tr
                        key={item.id ?? idx}
                        className={cx(
                          'print-avoid-break border-b border-[#0a1d44]/15 align-top text-[8px]',
                          isEven ? 'bg-white' : 'bg-[#edf3f9]'
                        )}
                      >
                        <td className="border-r border-[#0a1d44]/15 px-1 py-0.5 text-center font-bold text-[#0a1d44]">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="border-r border-[#0a1d44]/15 px-2 py-0.5 overflow-hidden">
                          <p className="font-bold text-ink text-[8.5px] leading-tight truncate">{item.product_name}</p>
                          {specParts.length > 0 && (
                            <p className="mt-0.5 text-[7px] leading-snug text-muted truncate">
                              {specParts.join('  |  ')}
                            </p>
                          )}
                        </td>
                        <td className="border-r border-[#0a1d44]/15 px-1 py-0.5 text-center font-medium text-ink truncate">
                          {calculatedSizeRange}
                        </td>
                        <td className="border-r border-[#0a1d44]/15 px-1 py-0.5 text-center font-bold tabular-nums text-ink">
                          {rowQty > 0 ? `${formatNumber(rowQty)} pcs` : '—'}
                        </td>
                        <td className="border-r border-[#0a1d44]/15 px-1.5 py-0.5 text-right tabular-nums text-ink">
                          {rowUnitPrice > 0 ? formatAmount(rowUnitPrice) : '—'}
                        </td>
                        <td className="px-1.5 py-0.5 text-right font-bold tabular-nums text-[#0a1d44]">
                          {rowTotalPrice > 0 ? formatAmount(rowTotalPrice) : '—'}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Template Filler Rows */}
                  {Array.from({ length: fillerCount }).map((_, fIdx) => {
                    const rowIdx = items.length + fIdx;
                    const isEven = rowIdx % 2 === 0;
                    return (
                      <tr
                        key={`filler-${fIdx}`}
                        className={cx(
                          'h-[16px] border-b border-[#0a1d44]/15',
                          isEven ? 'bg-white' : 'bg-[#edf3f9]'
                        )}
                      >
                        <td className="border-r border-[#0a1d44]/15 px-1 text-center font-semibold text-[#0a1d44]/40 text-[7.5px]">
                          {String(rowIdx + 1).padStart(2, '0')}
                        </td>
                        <td className="border-r border-[#0a1d44]/15 px-2">&nbsp;</td>
                        <td className="border-r border-[#0a1d44]/15 px-1.5">&nbsp;</td>
                        <td className="border-r border-[#0a1d44]/15 px-1.5">&nbsp;</td>
                        <td className="border-r border-[#0a1d44]/15 px-2">&nbsp;</td>
                        <td className="px-2">&nbsp;</td>
                      </tr>
                    );
                  })}

                  {/* SUB TOTAL */}
                  <tr className="border-b border-[#0a1d44]/15 bg-white">
                    <td colSpan={4} className="border-r border-[#0a1d44]/15 bg-white/50" />
                    <td className="border-r border-[#0a1d44]/15 px-2 py-0.5 text-right font-bold uppercase tracking-wide text-ink text-[7.5px] whitespace-nowrap">
                      SUB TOTAL
                    </td>
                    <td className="px-2 py-0.5 text-right font-bold tabular-nums text-ink text-[8px] whitespace-nowrap">
                      Rs. {formatAmount(q.subtotal)}
                    </td>
                  </tr>

                  {/* DISCOUNT */}
                  <tr className="border-b border-[#0a1d44]/15 bg-[#edf3f9]">
                    <td colSpan={4} className="border-r border-[#0a1d44]/15 bg-white/50" />
                    <td className="border-r border-[#0a1d44]/15 px-2 py-0.5 text-right font-medium uppercase tracking-wide text-ink text-[7.5px] whitespace-nowrap">
                      DISCOUNT
                    </td>
                    <td className="px-2 py-0.5 text-right font-medium tabular-nums text-ink text-[7.5px] whitespace-nowrap">
                      {discount > 0 ? `−Rs. ${formatAmount(discount)}` : 'Rs. 0.00'}
                    </td>
                  </tr>

                  {/* VAT (If Applicable) */}
                  <tr className="border-b border-[#0a1d44]/15 bg-white">
                    <td colSpan={4} className="border-r border-[#0a1d44]/15 bg-white/50" />
                    <td className="border-r border-[#0a1d44]/15 px-2 py-0.5 text-right font-medium uppercase tracking-wide text-ink text-[7.5px] whitespace-nowrap">
                      VAT {taxRate > 0 ? `(${taxRate}%)` : '(If Applicable)'}
                    </td>
                    <td className="px-2 py-0.5 text-right font-medium tabular-nums text-ink text-[7.5px] whitespace-nowrap">
                      {tax > 0 ? `Rs. ${formatAmount(tax)}` : 'Rs. 0.00'}
                    </td>
                  </tr>

                  {/* Extra Rows (e.g. Artwork, Delivery) */}
                  {extraRows.map((row) => (
                    <tr key={row.label} className={cx('border-b border-[#0a1d44]/15', row.isDue ? 'bg-amber-50/60' : 'bg-white')}>
                      <td colSpan={4} className="border-r border-[#0a1d44]/15 bg-white/50" />
                      <td className="border-r border-[#0a1d44]/15 px-2 py-0.5 text-right font-semibold uppercase tracking-wide text-ink text-[7.5px] whitespace-nowrap">
                        {row.label}
                      </td>
                      <td className={cx('px-2 py-0.5 text-right font-bold tabular-nums text-[8px] whitespace-nowrap', row.isDue ? 'text-[#b42318]' : 'text-ink')}>
                        {row.text ?? `${row.isDeduct ? '−' : ''}Rs. ${formatAmount(row.value)}`}
                      </td>
                    </tr>
                  ))}

                  {/* GRAND TOTAL */}
                  <tr className="bg-[#c6a04a] text-white">
                    <td colSpan={4} className="border-r border-white/20 bg-[#c6a04a]" />
                    <td className="border-r border-white/20 px-2 py-1 text-right font-black uppercase tracking-wider text-[8.5px] text-white whitespace-nowrap">
                      GRAND TOTAL
                    </td>
                    <td className="px-2 py-1 text-right font-black tabular-nums text-[9.5px] text-white whitespace-nowrap">
                      Rs. {formatAmount(q.total_amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. TERMS & PRODUCTION (From quotation_table.docx Table 2) */}
            <div className="grid grid-cols-2 gap-2.5 shrink-0">
              {/* Left: PAYMENT TERMS */}
              <div className="rounded-[2px] border border-[#d2dbe8] bg-[#f8fbfe]/95 p-1.5 text-[7.5px] leading-tight shadow-2xs">
                <p className="font-extrabold uppercase tracking-wider text-[#0a1d44] text-[8px]">
                  PAYMENT TERMS
                </p>
                <ul className="mt-0.5 space-y-0.5 text-ink font-medium">
                  <li className="flex items-start gap-1">
                    <span className="text-[#c6a04a] font-bold">•</span>
                    <span>Prices are in Sri Lankan Rupees (LKR).</span>
                  </li>
                  {q.payment_terms && (
                    <li className="flex items-start gap-1 text-[#0a1d44] font-bold pt-0.5 border-t border-[#d2dbe8]/60 mt-0.5">
                      <span className="text-[#c6a04a] font-bold">★</span>
                      <span>{q.payment_terms}</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Right: DELIVERY & PRODUCTION */}
              <div className="rounded-[2px] border border-[#d2dbe8] bg-[#f8fbfe]/95 p-1.5 text-[7.5px] leading-tight shadow-2xs">
                <p className="font-extrabold uppercase tracking-wider text-[#0a1d44] text-[8px]">
                  DELIVERY & PRODUCTION
                </p>
                <ul className="mt-0.5 space-y-0.5 text-ink font-medium">
                  <li className="flex items-start gap-1">
                    <span className="text-[#c6a04a] font-bold">•</span>
                    <span>Delivery Type: <strong className="text-[#0a1d44] font-bold">{deliveryType}</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: SLIDE 4 (WHY COMPANIES TRUST & CONTACT US) */}
        <div
          className="relative w-full overflow-hidden shrink-0"
          style={{ height: '148.5mm', width: '210mm' }}
        >
          <img
            src={page4Contact}
            alt="Why Companies Trust & Contact Us"
            className="absolute inset-0 h-full w-full object-fill pointer-events-none select-none"
          />
        </div>
      </div>
    </div>
  );
}
