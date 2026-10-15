import React from 'react';
import { Trash2Icon } from 'lucide-react';
import type { Product } from '../../types/api';
import type { DraftLineItem } from '../../types/forms';
import { formatMoney } from '../../utils/format';
import { inputClass } from '../../utils/styles';
import { SizeToggleGroup } from './SizeToggleGroup';
import { ColourTagsInput } from './ColourTagsInput';

interface LineItemRowProps {
  item: DraftLineItem;
  index: number;
  products: Product[] | null;
  productsLoading: boolean;
  canRemove: boolean;
  requirePrinting?: boolean;
  onPatch: (patch: Partial<DraftLineItem>) => void;
  onPickProduct: (id: number) => void;
  onRemove: () => void;
}

const label = 'mb-1 block text-xs text-faint';

export function LineItemRow({ item, index, products, productsLoading, canRemove, requirePrinting, onPatch, onPickProduct, onRemove }: LineItemRowProps) {
  const id = (f: string) => `li-${item.key}-${f}`;
  const total = Number(item.quantity || 0) * Number(item.unit_price || 0);

  return (
    <li className="space-y-3 px-4 py-4" aria-label={`Line item ${index + 1}`}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-[minmax(0,1fr)_96px_128px_120px_32px] md:items-end">
        <div className="col-span-2 md:col-span-1">
          <label htmlFor={id('product')} className={label}>Product</label>
          <select id={id('product')} className={inputClass} value={item.product_id ?? ''} onChange={(e) => onPickProduct(Number(e.target.value))}>
            <option value="">{productsLoading ? 'Loading…' : 'Select product'}</option>
            {products?.map((p) =>
            <option key={p.id} value={p.id}>{p.name}</option>
            )}
          </select>
        </div>
        <div>
          <label htmlFor={id('qty')} className={label}>Total qty</label>
          <input id={id('qty')} type="number" min={1} className={inputClass} value={item.quantity} onChange={(e) => onPatch({ quantity: e.target.value })} />
        </div>
        <div>
          <label htmlFor={id('price')} className={label}>Unit price</label>
          <input id={id('price')} type="number" min={0} step="0.01" className={inputClass} value={item.unit_price} onChange={(e) => onPatch({ unit_price: e.target.value })} />
        </div>
        <div className="md:text-right">
          <span className={label}>Line total</span>
          <p className="py-2 text-sm font-medium tabular-nums">{formatMoney(total)}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="mb-1.5 justify-self-end rounded p-1 text-faint transition-colors duration-150 hover:text-danger disabled:opacity-30"
          aria-label={`Remove line item ${index + 1}`}>
          
          <Trash2Icon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_112px_180px]">
        <div>
          <span id={id('sizes')} className={label}>Sizes</span>
          <SizeToggleGroup labelId={id('sizes')} value={item.sizes} onChange={(sizes) => onPatch({ sizes })} />
        </div>
        <div>
          <label htmlFor={id('colours')} className={label}>Colours</label>
          <ColourTagsInput id={id('colours')} value={item.colours} onChange={(colours) => onPatch({ colours })} />
        </div>
        <div className="grid grid-cols-2 gap-3 md:col-span-2 lg:col-span-2 lg:grid-cols-[112px_180px]">
          <div>
            <label htmlFor={id('gsm')} className={label}>GSM</label>
            <input id={id('gsm')} className={inputClass} value={item.fabric_gsm} onChange={(e) => onPatch({ fabric_gsm: e.target.value })} />
          </div>
          <div>
            <label htmlFor={id('print')} className={label}>
              Printing{requirePrinting && <span className="ml-0.5 text-danger">*</span>}
            </label>
            <input
              id={id('print')}
              required={requirePrinting}
              className={inputClass}
              placeholder="Screen print"
              value={item.printing_method}
              onChange={(e) => onPatch({ printing_method: e.target.value })}
            />
          </div>
        </div>
      </div>
    </li>);

}