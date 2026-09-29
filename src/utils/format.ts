import { format, isValid, parseISO, formatDistanceToNow } from 'date-fns';

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

/** Plain amount with two decimals and no currency prefix — for document tables. */
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

export function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return format(d, 'yyyy-MM-dd');
}