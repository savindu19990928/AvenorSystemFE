import React from 'react';
import type { OrderDetail } from '../../types/api';
import { formatMoney, formatNumber, itemVariant } from '../../utils/format';
import { StatusBadge } from '../ui/StatusBadge';

export function OrderOverviewTab({ order }: {order: OrderDetail;}) {
  const qty = order.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <div className="space-y-6 p-5">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs text-faint">
            <tr>
              <th className="min-w-[240px] py-2 pr-3 font-medium">Product</th>
              <th className="py-2 pr-3 font-medium">Colours</th>
              <th className="py-2 pr-3 font-medium">Sizes</th>
              <th className="py-2 pr-3 font-medium">Fabric</th>
              <th className="py-2 pr-3 font-medium">Printing</th>
              <th className="py-2 pr-3 text-right font-medium">Qty</th>
              <th className="py-2 pr-3 text-right font-medium">Unit</th>
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i, idx) =>
            <tr key={i.id ?? idx} className="border-b border-line/70 align-top">
                <td className="py-2.5 pr-3 font-medium">{i.product_name}</td>
                <td className="py-2.5 pr-3 text-muted">{itemVariant(i).colours || '—'}</td>
                <td className="py-2.5 pr-3 text-muted">{itemVariant(i).sizes || '—'}</td>
                <td className="py-2.5 pr-3 text-muted">{i.fabric_gsm || '—'}</td>
                <td className="py-2.5 pr-3 text-muted">{i.printing_method || '—'}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{formatNumber(i.quantity)}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{formatMoney(i.unit_price)}</td>
                <td className="py-2.5 text-right tabular-nums">{formatMoney(i.total_price)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="py-2.5 text-xs text-muted">{order.items.length} line{order.items.length === 1 ? '' : 's'}</td>
              <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">{formatNumber(qty)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 text-sm">
          {order.printing_embroidery_requirements &&
          <div>
              <p className="text-xs text-muted">Printing / embroidery requirements</p>
              <p className="mt-0.5">{order.printing_embroidery_requirements}</p>
            </div>
          }
          <div>
            <p className="text-xs text-muted">Stock reservations</p>
            {order.stock_reservations?.length ?
            <ul className="mt-1 space-y-1">
                {order.stock_reservations.map((r) =>
              <li key={r.id} className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs">{r.inventory_sku}</span>
                    <span className="flex items-center gap-2 tabular-nums">{formatNumber(r.quantity)} <StatusBadge status={r.status} /></span>
                  </li>
              )}
              </ul> :

            <p className="mt-0.5 text-faint">No blanks reserved yet.</p>
            }
          </div>
        </div>
        <dl className="space-y-1.5 rounded-lg bg-canvas p-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatMoney(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Artwork charges</dt><dd className="tabular-nums">{formatMoney(order.artwork_charges)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="tabular-nums">{formatMoney(order.delivery_charges)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd className="tabular-nums">−{formatMoney(order.discount_amount)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="tabular-nums">{formatMoney(order.tax_amount)}</dd></div>
          <div className="flex justify-between border-t border-line pt-1.5 font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatMoney(order.total_amount)}</dd></div>
        </dl>
      </div>
    </div>);

}