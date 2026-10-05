import { format, isValid, parseISO, formatDistanceToNow } from 'date-fns';
import type { CellFormat, CellValue, PrintLineItem } from '../types/print';

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

export function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return format(d, 'yyyy-MM-dd');
}