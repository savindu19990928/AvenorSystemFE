import React from 'react';
import type { PrintableDocument } from '../../types/documents';
import { quotationTemplate } from '../../data/quotationTemplate';

interface TemplatePreparedForProps {
  doc: PrintableDocument;
  pageWidth: number;
  pageHeight: number;
}

/** Fills the "Quotation prepared for" box on the proposal cover. */
export function TemplatePreparedFor({ doc, pageWidth, pageHeight }: TemplatePreparedForProps) {
  const a = quotationTemplate.preparedForArea;
  return (
    <div
      style={{
        position: 'absolute',
        left: a.x * pageWidth,
        top: a.y * pageHeight,
        width: a.w * pageWidth,
        height: a.h * pageHeight,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        overflow: 'hidden'
      }}>
      
      <div style={{ fontSize: 17, fontWeight: 600, color: '#ffffff', lineHeight: 1.25 }}>{doc.billTo.name}</div>
      {doc.billTo.contact && <div style={{ marginTop: 3, fontSize: 11, color: '#D4B06A' }}>Attn: {doc.billTo.contact}</div>}
    </div>);

}