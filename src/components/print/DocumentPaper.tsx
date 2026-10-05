import React from 'react';
import type { BrandIdentity, MetaItem } from '../../types/print';
import { formatDateTime } from '../../utils/format';
import { cx } from '../../utils/styles';

interface DocumentPaperProps {
  brand: BrandIdentity;
  title: string;
  number?: string;
  meta?: MetaItem[];
  stamp?: {label: string;tone: 'ok' | 'danger';};
  children: React.ReactNode;
}

const brandColour = { premium: 'text-premium', standard: 'text-standard', neutral: 'text-ink' };

/** A4 sheet (794×1123px at 96dpi) with brand letterhead. Shared by every printable document. */
export function DocumentPaper({ brand, title, number, meta, stamp, children }: DocumentPaperProps) {
  return (
    <div className="doc-paper flex min-h-[1123px] w-[794px] flex-col bg-white px-14 py-12 text-[13px] leading-relaxed text-ink">
      <header className="flex items-start justify-between gap-8 border-b-2 border-ink pb-6">
        <div className="min-w-0">
          <p className={cx('text-xl font-semibold tracking-tight', brandColour[brand.tone])}>{brand.name}</p>
          {brand.company && <p className="text-muted">{brand.company}</p>}
          {brand.positioning && <p className="mt-0.5 text-xs text-faint">{brand.positioning}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-semibold tracking-tight">{title}</p>
          {number && <p className="mt-1 font-mono text-sm">{number}</p>}
          {stamp &&
          <p
            className={cx(
              'mt-2 inline-block rounded border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-wider',
              stamp.tone === 'ok' ? 'border-ok text-ok' : 'border-danger text-danger'
            )}>
            
              {stamp.label}
            </p>
          }
        </div>
      </header>

      {meta && meta.length > 0 &&
      <dl className="grid grid-cols-4 gap-x-6 gap-y-3 border-b border-line py-4">
          {meta.map((m) =>
        <div key={m.label} className="min-w-0">
              <dt className="text-[11px] text-faint">{m.label}</dt>
              <dd className="font-medium">{m.value || '—'}</dd>
            </div>
        )}
        </dl>
      }

      <div className="flex-1 space-y-7 pt-6">{children}</div>

      <footer className="mt-10 flex justify-between gap-4 border-t border-line pt-3 text-[11px] text-faint">
        <span>{brand.company || brand.name}</span>
        <span>Generated {formatDateTime(new Date().toISOString())}</span>
      </footer>
    </div>);

}