export const inputClass =
'block w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-faint shadow-sm outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-canvas disabled:text-faint';

export const cardClass = 'rounded-xl border border-line bg-surface';

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}