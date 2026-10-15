import React from 'react';
import { PlusIcon } from 'lucide-react';
import type { Product } from '../../types/api';
import type { DraftLineItem } from '../../types/forms';
import { newDraftItem } from '../../types/forms';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { Button } from '../ui/Button';
import { LineItemRow } from './LineItemRow';

interface LineItemsEditorProps {
  brandId: number | null;
  items: DraftLineItem[];
  onChange: (items: DraftLineItem[]) => void;
  requirePrinting?: boolean;
}

export function LineItemsEditor({ brandId, items, onChange, requirePrinting }: LineItemsEditorProps) {
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
      <ul className="divide-y divide-line rounded-lg border border-line">
        {items.map((item, index) =>
        <LineItemRow
          key={item.key}
          item={item}
          index={index}
          products={products.data}
          productsLoading={products.loading}
          canRemove={items.length > 1}
          requirePrinting={requirePrinting}
          onPatch={(patch) => update(item.key, patch)}
          onPickProduct={(id) => pickProduct(item.key, id)}
          onRemove={() => onChange(items.filter((i) => i.key !== item.key))} />

        )}
      </ul>
      <p className="mt-2 text-xs text-muted">Pick every size and colour this product comes in — they stay together as one line item.</p>
      {products.data && products.data.length === 0 && !products.loading &&
      <p className="mt-1 text-xs text-warn">This brand has no active products in the catalogue yet.</p>
      }
      <Button size="sm" variant="ghost" icon={PlusIcon} className="mt-2" onClick={() => onChange([...items, newDraftItem()])}>
        Add line
      </Button>
    </div>);

}