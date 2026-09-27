export interface DraftLineItem {
  key: string;
  product_id: number | null;
  quantity: string;
  size: string;
  colour: string;
  fabric_gsm: string;
  printing_method: string;
  unit_price: string;
}

export function newDraftItem(partial: Partial<DraftLineItem> = {}): DraftLineItem {
  return {
    key: Math.random().toString(36).slice(2),
    product_id: null,
    quantity: '',
    size: 'L',
    colour: '',
    fabric_gsm: '',
    printing_method: '',
    unit_price: '',
    ...partial
  };
}

export function isDraftItemValid(item: DraftLineItem): boolean {
  return !!item.product_id && Number(item.quantity) >= 1 && Number(item.unit_price) >= 0 && item.unit_price !== '' && !!item.colour.trim();
}

export function toItemPayload(item: DraftLineItem) {
  return {
    product_id: item.product_id,
    quantity: Number(item.quantity),
    size: item.size,
    colour: item.colour.trim(),
    fabric_gsm: item.fabric_gsm.trim(),
    printing_method: item.printing_method.trim(),
    unit_price: Number(item.unit_price).toFixed(2)
  };
}