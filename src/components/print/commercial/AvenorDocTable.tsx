import React from 'react';
import { formatAmount, formatNumber, itemVariant, sizeRange, toNumber } from '../../../utils/format';
import { cx } from '../../../utils/styles';

export interface AvenorDocTableItem {
  id?: number | string;
  product_name: string;
  description?: string;
  sizes?: string[];
  size?: string;
  colours?: string[];
  colour?: string;
  fabric_gsm?: string;
  printing_method?: string;
  quantity?: number;
  unit_price?: number | string;
  total_price?: number | string;
  details?: string[];
}

export interface ExtraTotalRow {
  label: string;
  value?: number | string;
  text?: string;
  isDeduct?: boolean;
  isDue?: boolean;
}

export interface AvenorDocTableProps {
  items: AvenorDocTableItem[];
  subtotal: number | string;
  discount?: number | string;
  tax?: number | string;
  taxRatePercent?: number | string;
  grandTotal: number | string;
  extraRows?: ExtraTotalRow[];
  minRows?: number;
  paymentTerms?: string;
  deliveryNotes?: string;
}

export function AvenorDocTable({
  items,
  subtotal,
  discount,
  tax,
  taxRatePercent,
  grandTotal,
  extraRows = [],
  minRows = 5,
  paymentTerms,
  deliveryNotes
}: AvenorDocTableProps) {
  const discountVal = toNumber(discount);
  const taxVal = toNumber(tax);
  const taxRateVal = toNumber(taxRatePercent);
  const fillerCount = Math.max(0, minRows - items.length);

  return (
    <div className="w-full text-ink">
      {/* ============================================================== */}
      {/* 1. MAIN APPAREL TABLE (From quotation_bill_invoice_table.docx) */}
      {/* ============================================================== */}
      <div className="overflow-hidden border border-[#0a1d44]/30 rounded-[2px]">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#0a1d44] text-[10.5px] font-bold uppercase tracking-wider text-white">
              <th className="w-[8%] border-r border-white/20 px-2 py-2.5 text-center">ITEMS</th>
              <th className="w-[42%] border-r border-white/20 px-3 py-2.5 text-left">DESCRIPTION</th>
              <th className="w-[16%] border-r border-white/20 px-2 py-2.5 text-center">SIZE RANGE</th>
              <th className="w-[10%] border-r border-white/20 px-2 py-2.5 text-center">QTY</th>
              <th className="w-[12%] border-r border-white/20 px-2.5 py-2.5 text-right">UNIT PRICE</th>
              <th className="w-[12%] px-3 py-2.5 text-right">TOTAL (LKR)</th>
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
                    'print-avoid-break border-b border-[#0a1d44]/15 align-top text-[11px]',
                    isEven ? 'bg-white' : 'bg-[#edf3f9]'
                  )}
                >
                  <td className="border-r border-[#0a1d44]/15 px-2 py-2 text-center font-bold text-[#0a1d44]">
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="border-r border-[#0a1d44]/15 px-3 py-2">
                    <p className="font-bold text-ink text-[11.5px] leading-tight">{item.product_name}</p>
                    {specParts.length > 0 && (
                      <p className="mt-0.5 text-[10px] leading-snug text-muted">
                        {specParts.join('  |  ')}
                      </p>
                    )}
                  </td>
                  <td className="border-r border-[#0a1d44]/15 px-2 py-2 text-center font-medium text-ink">
                    {calculatedSizeRange}
                  </td>
                  <td className="border-r border-[#0a1d44]/15 px-2 py-2 text-center font-bold tabular-nums text-ink">
                    {rowQty > 0 ? `${formatNumber(rowQty)} pcs` : '—'}
                  </td>
                  <td className="border-r border-[#0a1d44]/15 px-2.5 py-2 text-right tabular-nums text-ink">
                    {rowUnitPrice > 0 ? formatAmount(rowUnitPrice) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums text-[#0a1d44]">
                    {rowTotalPrice > 0 ? formatAmount(rowTotalPrice) : '—'}
                  </td>
                </tr>
              );
            })}

            {/* Template Filler Rows (Preserving exact 01-05 row grid from reference docx) */}
            {Array.from({ length: fillerCount }).map((_, fIdx) => {
              const rowIdx = items.length + fIdx;
              const isEven = rowIdx % 2 === 0;
              return (
                <tr
                  key={`filler-${fIdx}`}
                  className={cx(
                    'h-[32px] border-b border-[#0a1d44]/15',
                    isEven ? 'bg-white' : 'bg-[#edf3f9]'
                  )}
                >
                  <td className="border-r border-[#0a1d44]/15 px-2 py-1 text-center font-semibold text-[#0a1d44]/40">
                    {String(rowIdx + 1).padStart(2, '0')}
                  </td>
                  <td className="border-r border-[#0a1d44]/15 px-3 py-1">&nbsp;</td>
                  <td className="border-r border-[#0a1d44]/15 px-2 py-1">&nbsp;</td>
                  <td className="border-r border-[#0a1d44]/15 px-2 py-1">&nbsp;</td>
                  <td className="border-r border-[#0a1d44]/15 px-2.5 py-1">&nbsp;</td>
                  <td className="px-3 py-1">&nbsp;</td>
                </tr>
              );
            })}

            {/* ============================================================== */}
            {/* TOTALS ROWS (Matching docx Table 1 format & gold grand total)   */}
            {/* ============================================================== */}
            {/* SUB TOTAL */}
            <tr className="border-b border-[#0a1d44]/15 bg-white">
              <td colSpan={4} className="border-r border-[#0a1d44]/15 bg-white/50" />
              <td className="border-r border-[#0a1d44]/15 px-3 py-1.5 text-right font-bold uppercase tracking-wide text-ink text-[11px]">
                SUB TOTAL
              </td>
              <td className="px-3 py-1.5 text-right font-bold tabular-nums text-ink text-[11.5px]">
                Rs. {formatAmount(subtotal)}
              </td>
            </tr>

            {/* DISCOUNT */}
            <tr className="border-b border-[#0a1d44]/15 bg-[#edf3f9]">
              <td colSpan={4} className="border-r border-[#0a1d44]/15 bg-white/50" />
              <td className="border-r border-[#0a1d44]/15 px-3 py-1.5 text-right font-medium uppercase tracking-wide text-ink text-[11px]">
                DISCOUNT
              </td>
              <td className="px-3 py-1.5 text-right font-medium tabular-nums text-ink text-[11px]">
                {discountVal > 0 ? `−Rs. ${formatAmount(discountVal)}` : 'Rs. 0.00'}
              </td>
            </tr>

            {/* VAT (If Applicable) */}
            <tr className="border-b border-[#0a1d44]/15 bg-white">
              <td colSpan={4} className="border-r border-[#0a1d44]/15 bg-white/50" />
              <td className="border-r border-[#0a1d44]/15 px-3 py-1.5 text-right font-medium uppercase tracking-wide text-ink text-[11px]">
                VAT {taxRateVal > 0 ? `(${taxRateVal}%)` : '(If Applicable)'}
              </td>
              <td className="px-3 py-1.5 text-right font-medium tabular-nums text-ink text-[11px]">
                {taxVal > 0 ? `Rs. ${formatAmount(taxVal)}` : 'Rs. 0.00'}
              </td>
            </tr>

            {/* Extra Rows (e.g. Artwork, Delivery, etc. if present) */}
            {extraRows.map((row) => (
              <tr key={row.label} className={cx('border-b border-[#0a1d44]/15', row.isDue ? 'bg-amber-50/60' : 'bg-white')}>
                <td colSpan={4} className="border-r border-[#0a1d44]/15 bg-white/50" />
                <td className="border-r border-[#0a1d44]/15 px-3 py-1.5 text-right font-semibold uppercase tracking-wide text-ink text-[11px]">
                  {row.label}
                </td>
                <td className={cx('px-3 py-1.5 text-right font-bold tabular-nums text-[11.5px]', row.isDue ? 'text-red-700' : 'text-ink')}>
                  {row.text ?? `${row.isDeduct ? '−' : ''}Rs. ${formatAmount(row.value)}`}
                </td>
              </tr>
            ))}

            {/* GRAND TOTAL (docx background: #c6a04a, bold text) */}
            <tr className="bg-[#c6a04a] text-white">
              <td colSpan={4} className="border-r border-white/20 bg-[#c6a04a]" />
              <td className="border-r border-white/20 px-3 py-2 text-right font-black uppercase tracking-wider text-[12px] text-white drop-shadow-xs">
                GRAND TOTAL
              </td>
              <td className="px-3 py-2 text-right font-black tabular-nums text-[13px] text-white drop-shadow-xs">
                Rs. {formatAmount(grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ============================================================== */}
      {/* 2. FOOTER TERMS & CONDITIONS (From docx Table 2)              */}
      {/* ============================================================== */}
      <div className="print-avoid-break mt-3.5 grid grid-cols-2 gap-4">
        {/* Left: PAYMENT TERMS */}
        <div className="rounded-[2px] border border-[#d2dbe8] bg-[#f8fbfe] p-3 text-[10.5px] leading-relaxed shadow-2xs">
          <p className="font-extrabold uppercase tracking-wider text-[#0a1d44] text-[11px]">
            PAYMENT TERMS
          </p>
          <ul className="mt-1.5 space-y-1 text-ink font-medium">
            <li className="flex items-start gap-1.5">
              <span className="text-[#c6a04a] font-bold">•</span>
              <span>Prices are in Sri Lankan Rupees (LKR).</span>
            </li>
            {paymentTerms && (
              <li className="flex items-start gap-1.5 text-[#0a1d44] font-bold pt-0.5 border-t border-[#d2dbe8]/60 mt-1">
                <span className="text-[#c6a04a] font-bold">★</span>
                <span>{paymentTerms}</span>
              </li>
            )}
          </ul>
        </div>

        {/* Right: DELIVERY & PRODUCTION */}
        <div className="rounded-[2px] border border-[#d2dbe8] bg-[#f8fbfe] p-3 text-[10.5px] leading-relaxed shadow-2xs">
          <p className="font-extrabold uppercase tracking-wider text-[#0a1d44] text-[11px]">
            DELIVERY & PRODUCTION
          </p>
          <ul className="mt-1.5 space-y-1 text-ink font-medium">
            <li className="flex items-start gap-1.5">
              <span className="text-[#c6a04a] font-bold">•</span>
              <span>Delivery charges apply unless otherwise agreed.</span>
            </li>
            {deliveryNotes && (
              <li className="flex items-start gap-1.5">
                <span className="text-[#c6a04a] font-bold">•</span>
                <span>{deliveryNotes}</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
