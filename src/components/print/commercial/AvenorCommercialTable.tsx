import React from 'react';
import { formatAmount, formatNumber, sizeRange, toNumber } from '../../../utils/format';
import { cx } from '../../../utils/styles';

export interface AvenorLineItem {
  id?: number | string;
  product_name: string;
  quantity?: number;
  sizes?: string[];
  size?: string;
  colours?: string[];
  colour?: string;
  fabric_gsm?: string;
  printing_method?: string;
  unit_price?: string | number;
  total_price?: string | number;
  amount?: string | number;
  description?: string;
  details?: string[];
  rate_type?: string;
  customTitle?: string;
}

export interface ExtraTotalRow {
  label: string;
  value?: string | number;
  text?: string;
  deduct?: boolean;
}

export interface AvenorCommercialTableProps {
  items: AvenorLineItem[];
  subtotal: string | number;
  discount?: string | number;
  tax?: string | number;
  taxRate?: string | number;
  total: string | number;
  totalLabel?: string;
  currencyPrefix?: string;
  extraRows?: ExtraTotalRow[];
  minRows?: number;
}

/** Formats an item into the standardized Avenor description: "Product Name [ Sizes (QtyQTY) ] Per unit" */
export function formatAvenorItemDescription(item: AvenorLineItem): { title: string; subtitle?: string } {
  if (item.customTitle) {
    return { title: item.customTitle };
  }

  const name = item.product_name || item.description || 'Custom Apparel Item';

  const sizeList = item.sizes?.length
    ? item.sizes
    : item.size
      ? item.size.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)
      : [];
  const sizeText = sizeRange(sizeList);

  const qty = item.quantity !== undefined ? Number(item.quantity) : 0;
  const qtyText = qty > 0 ? `${formatNumber(qty)}QTY` : '';

  const bracketInner = [sizeText, qtyText ? `(${qtyText})` : ''].filter(Boolean).join(' ');
  const bracket = bracketInner ? `[ ${bracketInner} ]` : '';

  // Determine rate suffix (e.g. "Per unit" as in reference image)
  let rateSuffix = item.rate_type ?? '';
  if (!rateSuffix) {
    const unitPriceNum = toNumber(item.unit_price);
    const totalPriceNum = toNumber(item.total_price);
    if (unitPriceNum > 0 && totalPriceNum > 0 && Math.abs(totalPriceNum - unitPriceNum) > 0.01 && qty > 1) {
      rateSuffix = `@ LKR${formatAmount(unitPriceNum)} / unit`;
    } else if (unitPriceNum > 0 || item.unit_price !== undefined) {
      rateSuffix = 'Per unit';
    }
  }

  const title = [name, bracket, rateSuffix].filter(Boolean).join(' ');

  // Subtitle / specifications
  const specs = [
    item.colours?.length ? `Colour: ${item.colours.join(', ')}` : item.colour ? `Colour: ${item.colour}` : '',
    [item.fabric_gsm, item.printing_method].filter(Boolean).join(' · '),
    item.description && item.description !== name ? item.description : '',
    ...(item.details ?? [])
  ].filter(Boolean);

  return {
    title,
    subtitle: specs.length ? specs.join('  |  ') : undefined
  };
}

export function AvenorCommercialTable({
  items,
  subtotal,
  discount,
  tax,
  taxRate,
  total,
  totalLabel = 'TOTAL COST',
  currencyPrefix = 'LKR',
  extraRows = [],
  minRows = 5
}: AvenorCommercialTableProps) {
  const discountVal = toNumber(discount);
  const taxVal = toNumber(tax);
  const fillerCount = Math.max(0, minRows - items.length);

  return (
    <div className="w-full select-none text-[12px] leading-snug">
      {/* 1. Main Items Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#0b2545] text-[12px] font-bold uppercase tracking-wider text-white">
            <th className="w-[72%] px-4 py-2.5 text-left">ITEM DESCRIPTION</th>
            <th className="w-[28%] px-6 py-2.5 text-right">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const isEven = idx % 2 === 0;
            const { title, subtitle } = formatAvenorItemDescription(item);
            const rowAmount =
              item.amount !== undefined
                ? item.amount
                : item.total_price !== undefined && toNumber(item.total_price) > 0
                  ? item.total_price
                  : item.unit_price;

            return (
              <tr
                key={item.id ?? idx}
                className={cx(
                  'border-b border-[#dbe7f2] align-top text-[12px]',
                  isEven ? 'bg-white' : 'bg-[#ebf3f9]'
                )}
              >
                <td className="border-r border-[#cddfe9] px-4 py-2.5 font-medium text-ink">
                  <p className="font-semibold text-ink">{title}</p>
                  {subtitle && (
                    <p className="mt-0.5 text-[10.5px] leading-tight text-muted">{subtitle}</p>
                  )}
                </td>
                <td className="px-6 py-2.5 text-right font-semibold tabular-nums text-ink">
                  {currencyPrefix}{formatAmount(rowAmount)}
                </td>
              </tr>
            );
          })}

          {/* Filler Rows (Preserves minimum 5 rows with zebra striping and vertical divider) */}
          {Array.from({ length: fillerCount }).map((_, fIdx) => {
            const rowIdx = items.length + fIdx;
            const isEven = rowIdx % 2 === 0;
            return (
              <tr
                key={`filler-${fIdx}`}
                className={cx(
                  'h-[38px] border-b border-[#dbe7f2]',
                  isEven ? 'bg-white' : 'bg-[#ebf3f9]'
                )}
              >
                <td className="border-r border-[#cddfe9] px-4 py-2.5">&nbsp;</td>
                <td className="px-6 py-2.5 text-right">&nbsp;</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 2. Solid Blue Dividing Line under table body (Matching Reference Image) */}
      <div className="h-[2.5px] w-full bg-[#005a9c]" />

      {/* 3. Totals Breakdown */}
      <div className="mt-2.5 space-y-1 text-[12px]">
        {/* Subtotal */}
        <div className="flex items-center">
          <div className="w-[72%] pr-8 text-right font-bold text-ink">Subtotal</div>
          <div className="w-[28%] px-6 text-right font-bold tabular-nums text-ink">
            {currencyPrefix}{formatAmount(subtotal)}
          </div>
        </div>

        {/* Discount (Shows empty on right if 0, matching reference image) */}
        <div className="flex items-center">
          <div className="w-[72%] pr-8 text-right font-medium text-ink">Discount</div>
          <div className="w-[28%] px-6 text-right font-medium tabular-nums text-ink">
            {discountVal > 0 ? `−${currencyPrefix}${formatAmount(discountVal)}` : ''}
          </div>
        </div>

        {/* Tax (Shows empty on right if 0, matching reference image) */}
        <div className="flex items-center">
          <div className="w-[72%] pr-8 text-right font-medium text-ink">
            Tax{taxRate && toNumber(taxRate) > 0 ? ` (${toNumber(taxRate)}%)` : ''}
          </div>
          <div className="w-[28%] px-6 text-right font-medium tabular-nums text-ink">
            {taxVal > 0 ? `${currencyPrefix}${formatAmount(taxVal)}` : ''}
          </div>
        </div>

        {/* Extra rows (Artwork, Delivery, Paid to date, Balance due, etc.) */}
        {extraRows.map((row) => (
          <div key={row.label} className="flex items-center">
            <div className="w-[72%] pr-8 text-right font-medium text-ink">{row.label}</div>
            <div className="w-[28%] px-6 text-right font-medium tabular-nums text-ink">
              {row.text ?? `${row.deduct ? '−' : ''}${currencyPrefix}${formatAmount(row.value)}`}
            </div>
          </div>
        ))}

        {/* TOTAL COST Banner (Matching Reference Image Navy Bar) */}
        <div className="mt-2 flex items-center bg-[#0b2545] py-2.5 text-white">
          <div className="w-[72%] pr-8 text-right text-[13px] font-extrabold uppercase tracking-wider text-white">
            {totalLabel}
          </div>
          <div className="w-[28%] px-6 text-right text-[14px] font-extrabold tabular-nums text-white">
            {currencyPrefix}{formatAmount(total)}
          </div>
        </div>
      </div>
    </div>
  );
}
