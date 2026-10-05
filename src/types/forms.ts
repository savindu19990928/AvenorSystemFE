export interface DraftLineItem {
  key: string;
  product_id: number | null;
  quantity: string;
  sizes: string[];
  colours: string[];
  fabric_gsm: string;
  printing_method: string;
  unit_price: string;
}

export function newDraftItem(partial: Partial<DraftLineItem> = {}): DraftLineItem {
  return {
    key: Math.random().toString(36).slice(2),
    product_id: null,
    quantity: '',
    sizes: [],
    colours: [],
    fabric_gsm: '',
    printing_method: '',
    unit_price: '',
    ...partial
  };
}

export function isDraftItemValid(item: DraftLineItem): boolean {
  return (
    !!item.product_id &&
    Number(item.quantity) >= 1 &&
    item.unit_price !== '' &&
    Number(item.unit_price) >= 0 &&
    item.sizes.length > 0 &&
    item.colours.length > 0);

}

/** One line item carrying every selected size and colour — the API keeps it as a single item. */
export function toItemPayload(item: DraftLineItem) {
  return {
    product_id: item.product_id,
    quantity: Number(item.quantity),
    sizes: item.sizes,
    colours: item.colours,
    fabric_gsm: item.fabric_gsm.trim(),
    printing_method: item.printing_method.trim(),
    unit_price: Number(item.unit_price).toFixed(2)
  };
}