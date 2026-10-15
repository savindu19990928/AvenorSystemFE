import React from 'react';
import type { BrandIdentity } from '../../../types/print';
import { company } from '../../../data/company';
import { avenorLogo, resolveSubBrand } from '../../../data/brandLogos';
import { cx } from '../../../utils/styles';

export interface MetaUnderlineItem {
  label: string;
  value: string;
}

export interface AvenorCommercialLayoutProps {
  documentTitle: string; // e.g. "QUOTATION" | "INVOICE" | "PAYMENT RECORD"
  brand: BrandIdentity;
  metaItems: MetaUnderlineItem[];
  customerName?: string;
  customerCompany?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerSignatureLabel?: string;
  stamp?: { label: string; tone: 'ok' | 'danger' | 'warning' };
  notes?: string;
  children: React.ReactNode;
}

export function AvenorCommercialLayout({
  documentTitle,
  brand,
  metaItems,
  customerName,
  customerCompany,
  customerPhone,
  customerEmail,
  customerAddress,
  customerSignatureLabel = 'Customer Acceptance',
  stamp,
  notes,
  children
}: AvenorCommercialLayoutProps) {
  // Always resolve sub brand (Zevora Custom or Masha.Ts)
  const subBrand = resolveSubBrand(brand.name, brand.code);

  return (
    <div
      className="doc-paper relative flex min-h-[1123px] w-[794px] flex-col overflow-hidden bg-white text-[12px] leading-snug text-ink select-none"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* ============================================================== */}
      {/* 1. TOP GEOMETRIC HEADER (Navy & Gold Avenor Theme)             */}
      {/* ============================================================== */}
      <header className="relative h-[112px] w-full shrink-0 select-none bg-white">
        <svg
          viewBox="0 0 794 112"
          className="block h-full w-full"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top horizontal strip across full width: Deep Navy with Gold bottom trim */}
          <rect x="0" y="0" width="794" height="11" fill="#0a1d44" />
          <rect x="0" y="9" width="794" height="2" fill="#c6a04a" />

          {/* Left Polygon: Deep Navy banner slanting down-left on the right */}
          <polygon points="0,11 462,11 398,112 0,112" fill="#0a1d44" />

          {/* Slanted Gold Accent Ribbon */}
          <polygon points="470,11 486,11 422,112 406,112" fill="#c6a04a" />

          {/* Right Polygon: Deep Navy banner with angled left edge */}
          <polygon points="496,11 794,11 794,112 432,112" fill="#0a1d44" />

          {/* Subtle gold line along top border of right banner */}
          <line x1="496" y1="12" x2="794" y2="12" stroke="#c6a04a" strokeWidth="2" />
        </svg>

        {/* Content Overlay inside Header */}
        <div className="pointer-events-none absolute inset-0 top-[11px] flex items-center justify-between px-8 text-white">
          {/* Left: Main Avenor Apparel Logo + Sub-Brand Badge */}
          <div className="flex max-w-[430px] items-center gap-3.5">
            {/* Main Logo: Avenor Apparel */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-white/15 p-1 border border-white/25 shadow-sm">
              <img
                src={avenorLogo}
                alt="Avenor Apparel"
                className="max-h-full max-w-full object-contain drop-shadow"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[15.5px] font-black uppercase leading-tight tracking-wider text-white drop-shadow-sm">
                AVENOR APPAREL (PVT) LTD
              </p>
              <p className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-widest text-[#f6c87a]">
                {company.tagline.join('  |  ')}
              </p>

              {/* Sub Brand Mention with its logo */}
              <div className="mt-1 flex items-center gap-1.5 rounded-sm bg-white/10 px-2 py-0.5 border border-white/20 w-fit backdrop-blur-xs">
                {subBrand.logo && (
                  <img
                    src={subBrand.logo}
                    alt={subBrand.name}
                    className="h-3.5 w-auto max-w-[48px] object-contain brightness-0 invert"
                  />
                )}
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#f6c87a]">
                  Sub Brand: <span className="text-white font-extrabold">{subBrand.name}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Document Header Title */}
          <div className="pr-5 text-right">
            <h1
              className={cx(
                'font-extrabold uppercase drop-shadow-md text-white leading-tight',
                documentTitle.length > 11 ? 'text-[21px] tracking-[0.14em]' : 'text-[27px] tracking-[0.22em]'
              )}
            >
              {documentTitle}
            </h1>
            {stamp && (
              <span
                className={cx(
                  'mt-1 inline-block rounded-xs border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider',
                  stamp.tone === 'ok'
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                    : stamp.tone === 'danger'
                      ? 'border-rose-400 bg-rose-500/20 text-rose-300'
                      : 'border-amber-400 bg-amber-500/20 text-amber-300'
                )}
              >
                {stamp.label}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. METADATA ROW (Underline Format matching docx Table 0)        */}
      {/* ============================================================== */}
      <div className="mt-5 flex items-center justify-between gap-4 px-10">
        {metaItems.map((meta, i) => (
          <div key={i} className="flex flex-1 items-baseline gap-2 min-w-0">
            <span className="text-[11.5px] font-bold text-ink whitespace-nowrap">{meta.label}</span>
            <div className="inline-block flex-1 border-b-2 border-[#0a1d44] px-1 pb-0.5 text-center min-w-0">
              <span className="text-[11.5px] font-extrabold tracking-wide text-[#0a1d44] truncate block">
                {meta.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================== */}
      {/* 3. BILL FROM & BILL TO & SUB BRAND HIGHLIGHT                   */}
      {/* ============================================================== */}
      <div className="mt-5 grid grid-cols-2 gap-8 px-10">
        {/* Bill From */}
        <div className="rounded-[2px] border border-[#d2dbe8] bg-[#f8fbfe] p-3 text-[11px] leading-relaxed">
          <p className="text-[11.5px] font-extrabold uppercase tracking-wider text-[#0a1d44]">Bill From:</p>
          <div className="mt-1 space-y-0.5 text-ink">
            <p className="text-[12.5px] font-bold text-[#0a1d44]">AVENOR APPAREL (PVT) LTD</p>
            <p className="text-muted">{company.address}</p>
            <p className="text-[10.5px] text-muted">
              {company.phone}  |  {company.email}
            </p>
            <p className="text-[10.5px] font-medium text-[#0a1d44]">{company.website}</p>
          </div>
        </div>

        {/* Bill To */}
        <div className="rounded-[2px] border border-[#d2dbe8] bg-[#f8fbfe] p-3 text-[11px] leading-relaxed">
          <p className="text-[11.5px] font-extrabold uppercase tracking-wider text-[#0a1d44]">Bill To:</p>
          <div className="mt-1 space-y-0.5 text-ink">
            <p className="text-[12.5px] font-bold text-ink">
              {customerName || customerCompany || 'Valued Customer'}
            </p>
            {customerCompany && customerName && customerCompany !== customerName && (
              <p className="font-medium text-muted">{customerCompany}</p>
            )}
            {customerAddress && <p className="text-muted">{customerAddress}</p>}
            {(customerPhone || customerEmail) && (
              <p className="text-[10.5px] text-muted">
                {[customerPhone, customerEmail].filter(Boolean).join('  |  ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sub Brand Banner */}
      <div className="mt-3 mx-10 flex items-center justify-between rounded-[2px] border border-[#d2dbe8] bg-[#edf3f9] px-3.5 py-2">
        <div className="flex items-center gap-3">
          {subBrand.logo && (
            <div className="flex h-8 w-14 shrink-0 items-center justify-center rounded bg-white p-1 border border-[#cddfe9] shadow-2xs">
              <img
                src={subBrand.logo}
                alt={subBrand.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
          <div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted block leading-none">
              Manufactured & Supplied Under Sub Brand:
            </span>
            <span className="text-[12.5px] font-black text-[#0a1d44]">
              {subBrand.name}
            </span>
            <span className="ml-2 text-[10px] text-muted italic">
              (A Private Label & Custom Brand of Avenor Apparel (Pvt) Ltd)
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. DOCUMENT BODY (Table from docx & Terms)                     */}
      {/* ============================================================== */}
      <div className="mt-3.5 px-10 flex-1">
        {children}

        {notes && (
          <div className="mt-3 rounded-[2px] border border-[#d2dbe8] bg-[#f8fbfe] p-2.5 text-[10.5px] leading-relaxed">
            <strong className="font-bold text-[#0a1d44] uppercase tracking-wide">Special Instructions:</strong>{' '}
            <span className="text-ink">{notes}</span>
          </div>
        )}
      </div>

      <div className="min-h-[16px] flex-1" />

      {/* ============================================================== */}
      {/* 5. SIGNATURES (Underline Style matching image)                 */}
      {/* ============================================================== */}
      <div className="print-avoid-break mb-8 flex items-end justify-between px-12">
        {/* Left: Authorized Signature */}
        <div className="w-[240px] text-center">
          <div className="w-full border-b-2 border-[#0a1d44]" />
          <p className="mt-1.5 text-[11px] font-extrabold uppercase tracking-wider text-ink">
            Authorized Signature
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-[#0a1d44]">
            AVENOR APPAREL (PVT) LTD
          </p>
        </div>

        {/* Right: Customer Acceptance */}
        <div className="w-[240px] text-center">
          <div className="w-full border-b-2 border-[#0a1d44]" />
          <p className="mt-1.5 text-[11px] font-extrabold uppercase tracking-wider text-ink">
            {customerSignatureLabel}
          </p>
          <p className="mt-0.5 text-[10px] text-muted">
            {customerName || customerCompany || 'Authorized Representative'}
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. BOTTOM GEOMETRIC ACCENT & FOOTER LINK                       */}
      {/* ============================================================== */}
      <footer className="relative mt-auto border-t border-[#d8e4f0] px-10 py-2 flex items-center justify-between text-[10px] font-semibold text-muted">
        <div>
          <span className="text-[#0a1d44] font-bold">Avenor Apparel (Pvt) Ltd</span>
          <span className="mx-2 text-faint">|</span>
          <span>{company.phone}</span>
          <span className="mx-2 text-faint">|</span>
          <span>{company.email}</span>
          <span className="mx-2 text-faint">|</span>
          <span className="text-[#0a1d44] font-bold">{company.websiteShort}</span>
        </div>

        {/* Bottom Geometric Accent (Matching Top Header Angle) */}
        <div className="pointer-events-none absolute bottom-0 right-0 h-[30px] w-[220px] overflow-hidden">
          <svg viewBox="0 0 220 30" className="block h-full w-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="46,30 82,0 220,0 220,30" fill="#0a1d44" />
            <polygon points="30,30 66,0 76,0 40,30" fill="#c6a04a" />
          </svg>
        </div>
      </footer>
    </div>
  );
}
