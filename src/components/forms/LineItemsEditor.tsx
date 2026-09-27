import React from 'react';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import type { Product } from '../../types/api';
import type { DraftLineItem } from '../../types/forms';
import { newDraftItem } from '../../types/forms';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { SIZES } from '../../data/workflow';
import { formatMoney } from '../../utils/format';
import { Button } from '../ui/Button';
import { inputClass, cx } from '../../utils/styles';

interface LineItemsEditorProps {
  brandId: number | null;
  items: DraftLineItem[];
  onChange: (items: DraftLineItem[]) => void;
}

const cell = cx(inputClass, 'px-2 py-1.5');

export function LineItemsEditor({ brandId, items, onChange }: LineItemsEditorProps) {
  const products = useApi(
    () => brandId ? api.list<Product>('/api/catalog/products/', { brand: brandId, is_active: true }) : Promise.resolve([] as Product[]),
    [brandId]
  );

  const update = (key: string, patch: Partial<DraftLineItem>) => onChange(items.map((i) => i.key === key ? { ...i, ...patch } : i));

  const pickProduct = (key: string, id: number) => {
    const p = products.data?.find((x) => x.id === id);
    update(key, { product_id: id || null, fabric_gsm: p?.default_gsm ?? '', unit_price: p ? String(Number(p.base_price)) : '' });
  };

  if (!brandId) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-sm text-muted">
        Select a brand first — each brand has its own product catalogue and prices.
      </div>);

  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-canvas">
            <tr className="text-left text-xs text-faint">
              <th className="px-2 py-2 font-medium">Product</th>
              <th className="w-20 px-2 py-2 font-medium">Size</th>
              <th className="w-28 px-2 py-2 font-medium">Colour</th>
              <th className="w-24 px-2 py-2 font-medium">GSM</th>
              <th className="w-40 px-2 py-2 font-medium">Printing</th>
              <th className="w-20 px-2 py-2 font-medium">Qty</th>
              <th className="w-28 px-2 py-2 font-medium">Unit price</th>
              <th className="w-28 px-2 py-2 text-right font-medium">Line total</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) =>
            <tr key={item.key} className="border-t border-line">
                <td className="px-2 py-1.5">
                  <select aria-label="Product" className={cell} value={item.product_id ?? ''} onChange={(e) => pickProduct(item.key, Number(e.target.value))}>
                    <option value="">{products.loading ? 'Loading…' : 'Select product'}</option>
                    {products.data?.map((p) =>
                  <option key={p.id} value={p.id}>{p.name}</option>
                  )}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <select aria-label="Size" className={cell} value={item.size} onChange={(e) => update(item.key, { size: e.target.value })}>
                    {SIZES.map((s) =>
                  <option key={s}>{s}</option>
                  )}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <input aria-label="Colour" className={cell} placeholder="Black" value={item.colour} onChange={(e) => update(item.key, { colour: e.target.value })} />
                </td>
                <td className="px-2 py-1.5">
                  <input aria-label="GSM" className={cell} value={item.fabric_gsm} onChange={(e) => update(item.key, { fabric_gsm: e.target.value })} />
                </td>
                <td className="px-2 py-1.5">
                  <input aria-label="Printing method" className={cell} placeholder="Screen print" value={item.printing_method} onChange={(e) => update(item.key, { printing_method: e.target.value })} />
                </td>
                <td className="px-2 py-1.5">
                  <input aria-label="Quantity" type="number" min={1} className={cell} value={item.quantity} onChange={(e) => update(item.key, { quantity: e.target.value })} />
                </td>
                <td className="px-2 py-1.5">
                  <input aria-label="Unit price" type="number" min={0} step="0.01" className={cell} value={item.unit_price} onChange={(e) => update(item.key, { unit_price: e.target.value })} />
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-muted">{formatMoney(Number(item.quantity || 0) * Number(item.unit_price || 0))}</td>
                <td className="px-1 py-1.5">
                  <button
                  type="button"
                  onClick={() => onChange(items.filter((i) => i.key !== item.key))}
                  disabled={items.length === 1}
                  className="rounded p-1 text-faint transition-colors duration-150 hover:text-danger disabled:opacity-30"
                  aria-label="Remove line">
                  
                    <Trash2Icon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {products.data && products.data.length === 0 && !products.loading &&
      <p className="mt-2 text-xs text-warn">This brand has no active products in the catalogue yet.</p>
      }
      <Button size="sm" variant="ghost" icon={PlusIcon} className="mt-2" onClick={() => onChange([...items, newDraftItem()])}>
        Add line
      </Button>
    </div>);

}