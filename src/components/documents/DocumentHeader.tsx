import React from 'react';
import type { PrintableDocument } from '../../types/documents';
import { company, documentPalette as P } from '../../data/company';
import { DocBrandMark } from './DocBrandMark';

interface DocumentHeaderProps {
  doc: PrintableDocument;
  companyLogo: string | null;
}

const label: React.CSSProperties = { fontSize: 8.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.faint };

export function DocumentHeader({ doc, companyLogo }: DocumentHeaderProps) {
  const title = doc.kind === 'QUOTATION' ? 'Quotation' : 'Invoice';
  const meta = [
  { label: `${title} no.`, value: doc.number, mono: true },
  { label: doc.kind === 'QUOTATION' ? 'Date issued' : 'Invoice date', value: doc.issueDate },
  { label: doc.dueLabel, value: doc.dueDate },
  ...(doc.reference ? [{ label: doc.reference.label, value: doc.reference.value }] : [])];

  const party = doc.billTo;

  return (
    <>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <DocBrandMark name={company.name} logo={companyLogo} size={62} />
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{company.name}</div>
            <div style={{ marginTop: 4, fontSize: 9, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: P.gold }}>
              {company.tagline}
            </div>
            <div style={{ marginTop: 10, fontSize: 10, lineHeight: 1.65, color: P.muted }}>
              <div>{company.addressLines.join(', ')}</div>
              <div>
                {company.phone} · {company.mobile}
              </div>
              <div>
                {company.email} · {company.website}
              </div>
              <div>Company Reg. No. {company.registrationNo}</div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 30, fontWeight: 300, letterSpacing: '0.22em', lineHeight: 1, textTransform: 'uppercase' }}>{title}</div>
          <div style={{ marginTop: 10, marginLeft: 'auto', width: 48, height: 2, background: P.gold }} />
        </div>
      </header>

      <div
        style={{
          marginTop: 28,
          display: 'grid',
          gridTemplateColumns: `repeat(${meta.length}, 1fr)`,
          borderTop: `1px solid ${P.line}`,
          borderBottom: `1px solid ${P.line}`
        }}>
        
        {meta.map((m, i) =>
        <div key={m.label} style={{ padding: '12px 0', paddingLeft: i === 0 ? 0 : 16, borderLeft: i === 0 ? 'none' : `1px solid ${P.line}` }}>
            <div style={label}>{m.label}</div>
            <div
            style={{
              marginTop: 5,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: m.mono ? "'JetBrains Mono', ui-monospace, monospace" : undefined
            }}>
            
              {m.value}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 32, alignItems: 'stretch' }}>
        <div>
          <div style={label}>{doc.kind === 'QUOTATION' ? 'Prepared for' : 'Bill to'}</div>
          <div style={{ marginTop: 8, fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{party.name}</div>
          {party.contact && <div style={{ marginTop: 3, fontSize: 11.5, color: P.ink }}>Attn: {party.contact}</div>}
          <div style={{ marginTop: 6, fontSize: 10.5, lineHeight: 1.6, color: P.muted }}>
            {party.address && <div>{party.address}</div>}
            {(party.phone || party.email) && <div>{[party.phone, party.email].filter(Boolean).join(' · ')}</div>}
            {party.taxNumber && <div>Tax / VAT no. {party.taxNumber}</div>}
          </div>
        </div>
        <div style={{ background: P.wash, borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <DocBrandMark name={doc.brand.name} logo={doc.brand.logo} size={52} />
          <div style={{ minWidth: 0 }}>
            <div style={label}>Brand</div>
            <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700 }}>{doc.brand.name}</div>
            {doc.brand.positioning && <div style={{ marginTop: 2, fontSize: 10, color: P.muted, lineHeight: 1.45 }}>{doc.brand.positioning}</div>}
          </div>
        </div>
      </div>
    </>);

}