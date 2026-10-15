import { format, isValid, parseISO, formatDistanceToNow } from 'date-fns';
import type { CellFormat, CellValue, CommercialLine, PrintLineItem } from '../types/print';
import { SIZES } from '../data/workflow';

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(value: string | number | null | undefined, opts: {compact?: boolean;} = {}): string {
  const n = toNumber(value);
  if (opts.compact && Math.abs(n) >= 100000) {
    return `Rs. ${new Intl.NumberFormat('en-LK', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}`;
  }
  return `Rs. ${new Intl.NumberFormat('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)}`;
}

/** Plain two-decimal amount for document tables, e.g. 2,115,000.00 (currency stated in the header). */
export function formatAmount(value: string | number | null | undefined): string {
  return new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(toNumber(value));
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat('en-LK').format(value ?? 0);
}

function parse(value?: string | null): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

export function formatDate(value?: string | null): string {
  const d = parse(value);
  return d ? format(d, 'd MMM yyyy') : '—';
}

export function formatDateTime(value?: string | null): string {
  const d = parse(value);
  return d ? format(d, 'd MMM yyyy, HH:mm') : '—';
}

export function formatLongDate(value?: string | null): string {
  const d = parse(value);
  return d ? format(d, 'd MMMM yyyy') : '—';
}

export function timeAgo(value?: string | null): string {
  const d = parse(value);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : '';
}

export function humanize(code?: string | null): string {
  if (!code) return '—';
  return code.
  toLowerCase().
  split('_').
  map((w) => w ? w[0].toUpperCase() + w.slice(1) : w).
  join(' ');
}

/** Joins a multi-value field (e.g. sizes/colours) falling back to the single-string form. */
export function joinValues(list?: string[] | null, fallback?: string | null): string {
  if (list && list.length) return list.join(', ');
  return fallback || '';
}

export function itemVariant(i: {sizes?: string[];colours?: string[];size?: string;colour?: string;}): {sizes: string;colours: string;} {
  return { sizes: joinValues(i.sizes, i.size), colours: joinValues(i.colours, i.colour) };
}

export function formatCell(value: CellValue, fmt: CellFormat = 'text'): string {
  if (value === null || value === undefined || value === '') return '—';
  if (fmt === 'money') return formatMoney(value);
  if (fmt === 'number') return formatNumber(toNumber(value));
  if (fmt === 'percent') return `${toNumber(value).toFixed(1)}%`;
  return String(value);
}

interface LineLike {
  product_name: string;
  quantity: number;
  sizes?: string[];
  colours?: string[];
  size?: string;
  colour?: string;
  fabric_gsm?: string;
  printing_method?: string;
  unit_price?: string;
  total_price?: string;
}

export function lineItemDetails(i: LineLike): string[] {
  const { sizes, colours } = itemVariant(i);
  return [colours && `Colours: ${colours}`, sizes && `Sizes: ${sizes}`, [i.fabric_gsm, i.printing_method].filter(Boolean).join(' · ')].filter(
    (s): s is string => !!s
  );
}

export function toPrintLine(i: LineLike): PrintLineItem {
  return { product_name: i.product_name, details: lineItemDetails(i), quantity: i.quantity, unit_price: i.unit_price, total_price: i.total_price };
}

/** Collapses a run of standard sizes to a range ("XXS-L"); otherwise lists them. */
export function sizeRange(sizes: string[]): string {
  const uniq = Array.from(new Set(sizes.map((s) => s.trim().toUpperCase()).filter(Boolean)));
  if (uniq.length === 0) return '';
  const idx = uniq.map((s) => SIZES.indexOf(s));
  if (uniq.length > 2 && idx.every((i) => i >= 0)) {
    const sorted = [...idx].sort((a, b) => a - b);
    const contiguous = sorted.every((v, k) => k === 0 || v === sorted[k - 1] + 1);
    if (contiguous) return `${SIZES[sorted[0]]}-${SIZES[sorted[sorted.length - 1]]}`;
  }
  return uniq.join(', ');
}

export function toCommercialLine(i: LineLike & {description?: string;}): CommercialLine {
  const { colours } = itemVariant(i);
  const sizeList = i.sizes?.length ? i.sizes : i.size ? i.size.split(/[,\s]+/) : [];
  return {
    description: i.product_name,
    details: [colours && `Colour: ${colours}`, [i.fabric_gsm, i.printing_method].filter(Boolean).join(' · '), i.description].filter((s): s is string => !!s),
    quantity: i.quantity,
    sizes: sizeRange(sizeList),
    unit_price: i.unit_price,
    total_price: i.total_price
  };
}

/** "a, b and c" */
export function joinList(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

export function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return format(d, 'yyyy-MM-dd');
}

/**
 * Resolves delivery type for quotations, invoices, bills, and payment records.
 * If the location/address/notes contains 'pickup' or 'pick up' (case-insensitive), returns 'Pick Up'.
 * Otherwise returns 'Delivery'.
 */
export function resolveDeliveryType(...locations: (string | null | undefined)[]): 'Pick Up' | 'Delivery' {
  for (const loc of locations) {
    if (!loc || typeof loc !== 'string') continue;
    const clean = loc.trim().toLowerCase();
    if (
      clean === 'pickup' ||
      clean === 'pick up' ||
      clean.replace(/[\s-_]/g, '') === 'pickup' ||
      /\bpick[\s-_]?up\b/i.test(clean)
    ) {
      return 'Pick Up';
    }
  }
  return 'Delivery';
}