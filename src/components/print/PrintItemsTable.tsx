import React from 'react';
import type { PrintLineItem } from '../../types/print';
import { formatMoney, formatNumber } from '../../utils/format';

export function PrintItemsTable({ items, showPrices = true }: {items: PrintLineItem[];showPrices?: boolean;}) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-ink text-left text-[11px] text-muted">
          <th className="w-8 py-2 pr-2 font-medium">#</th>
          <th className="py-2 pr-3 font-medium">Item</th>
          <th className="w-20 py-2 pr-3 text-right font-medium">Qty</th>
          {showPrices && <th className="w-28 py-2 pr-3 text-right font-medium">Unit price</th>}
          {showPrices && <th className="w-32 py-2 text-right font-medium">Amount</th>}
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ?
        <tr>
            <td colSpan={showPrices ? 5 : 3} className="py-6 text-center text-muted">No line items</td>
          </tr> :

        items.map((i, idx) =>
        <tr key={idx} className="print-avoid-break border-b border-line align-top">
              <td className="py-3 pr-2 text-faint tabular-nums">{idx + 1}</td>
              <td className="py-3 pr-3">
                <p className="font-medium">{i.product_name}</p>
                {i.details.map((d) =>
            <p key={d} className="text-xs text-muted">{d}</p>
            )}
              </td>
              <td className="py-3 pr-3 text-right tabular-nums">{formatNumber(i.quantity)}</td>
              {showPrices && <td className="py-3 pr-3 text-right tabular-nums">{formatMoney(i.unit_price)}</td>}
              {showPrices && <td className="py-3 text-right font-medium tabular-nums">{formatMoney(i.total_price)}</td>}
            </tr>
        )
        }
      </tbody>
    </table>);

}