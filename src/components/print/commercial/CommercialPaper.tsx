import React from 'react';
import type { BrandIdentity } from '../../../types/print';
import { company } from '../../../data/company';
import { cx } from '../../../utils/styles';
import { CompanyLogo } from './CompanyLogo';

interface CommercialPaperProps {
  brand: BrandIdentity;
  title: string;
  subtitle: string;
  reference?: string;
  dateLabel: string;
  dateValue: string;
  dateNotes?: string[];
  stamp?: {label: string;tone: 'ok' | 'danger';};
  children: React.ReactNode;
}

/** A4 sheet with the Avenor navy letterhead, used by quotations and invoices. */
export function CommercialPaper({ brand, title, subtitle, reference, dateLabel, dateValue, dateNotes = [], stamp, children }: CommercialPaperProps) {
  const companyName = (brand.company || company.name).toUpperCase();
  return (
    <div
      className="doc-paper flex min-h-[1123px] w-[794px] flex-col bg-white px-[52px] pb-7 pt-9 text-[12.5px] leading-snug text-ink"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      
      <header className="flex items-center gap-6 bg-doc-navy px-5 py-4 text-white">
        <div className="shrink-0">
          <CompanyLogo size={92} label={companyName} />
          <div className="mt-1 h-px bg-doc-gold" />
        </div>
        <div className="min-w-0">
          <p className="text-[27px] font-bold leading-tight tracking-tight">{companyName}</p>
          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-doc-gold">{company.tagline.join('  |  ')}</p>
          <p className="mt-1.5 text-[12.5px] leading-[1.45]">
            {company.address}
            <br />
            {company.phone}  |  {company.email}
            <br />
            {company.website}
          </p>
        </div>
      </header>

      <div className="mt-5 h-[3px] bg-doc-gold" />

      <div className="mt-3.5 flex items-start justify-between gap-6 px-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-[34px] font-bold uppercase leading-none tracking-tight text-doc-navy">{title}</h1>
            {stamp &&
            <span
              className={cx(
                'rounded border-2 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider',
                stamp.tone === 'ok' ? 'border-ok text-ok' : 'border-danger text-danger'
              )}>
              
                {stamp.label}
              </span>
            }
          </div>
          <p className="mt-1.5 text-[14px] text-muted">{subtitle}</p>
          {reference && <p className="mt-0.5 text-[11px] text-muted">Ref. <span className="font-mono text-ink">{reference}</span></p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-muted">{dateLabel}</p>
          <p className="mt-1 text-[15px] font-bold text-doc-navy">{dateValue}</p>
          {dateNotes.map((n) =>
          <p key={n} className="text-[11px] text-muted">{n}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-5">{children}</div>

      <div className="min-h-[32px] flex-1" />

      <footer className="border-t border-doc-gold pt-2.5 text-center text-[10.5px] text-muted">
        <span className="font-bold text-doc-navy">{companyName}</span>
        <span className="mx-2 text-faint">|</span>
        {company.phone}
        <span className="mx-2 text-faint">|</span>
        {company.email}
        <span className="mx-2 text-faint">|</span>
        {company.websiteShort}
      </footer>
    </div>);

}