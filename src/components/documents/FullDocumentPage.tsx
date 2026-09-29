import React from 'react';
import type { DocPageSlice, PrintableDocument } from '../../types/documents';
import { company, documentPalette as P } from '../../data/company';
import { DocBrandMark } from './DocBrandMark';
import { DocumentHeader } from './DocumentHeader';
import { DocumentItemsTable } from './DocumentItemsTable';
import { DocumentClosing } from './DocumentClosing';

export const A4_PX = { width: 794, height: 1123 };

interface FullDocumentPageProps {
  doc: PrintableDocument;
  companyLogo: string | null;
  slice: DocPageSlice;
  pageIndex: number;
  pageCount: number;
}

export function FullDocumentPage({ doc, companyLogo, slice, pageIndex, pageCount }: FullDocumentPageProps) {
  const isFirst = pageIndex === 0;
  const isLast = pageIndex === pageCount - 1;
  const title = doc.kind === 'QUOTATION' ? 'Quotation' : 'Invoice';

  return (
    <div
      style={{
        position: 'relative',
        width: A4_PX.width,
        height: A4_PX.height,
        overflow: 'hidden',
        background: '#ffffff',
        color: P.ink,
        fontFamily: "'Inter', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column'
      }}>
      
      <div style={{ height: 8, background: P.ink, flexShrink: 0 }} />
      <div style={{ height: 2, background: P.gold, flexShrink: 0 }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '38px 56px 70px' }}>
        {isFirst ?
        <DocumentHeader doc={doc} companyLogo={companyLogo} /> :

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: `1px solid ${P.line}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <DocBrandMark name={company.name} logo={companyLogo} size={30} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>{company.name}</span>
            </div>
            <span style={{ fontSize: 10.5, color: P.muted }}>
              {title} <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: P.ink }}>{doc.number}</span> · continued
            </span>
          </div>
        }

        <div style={{ marginTop: isFirst ? 26 : 20 }}>
          <DocumentItemsTable lines={slice.lines} startIndex={slice.startIndex} />
        </div>

        {isLast && <DocumentClosing doc={doc} />}
      </div>

      <footer style={{ position: 'absolute', left: 56, right: 56, bottom: 26 }}>
        <div style={{ height: 1, background: P.line }} />
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: P.faint }}>
          <span>
            {company.name} · {company.phone} · {company.email} · {company.website}
          </span>
          <span>
            Page {pageIndex + 1} of {pageCount}
          </span>
        </div>
      </footer>
    </div>);

}