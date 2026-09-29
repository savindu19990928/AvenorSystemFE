import React from 'react';
import type { PrintableDocument } from '../../types/documents';
import { quotationTemplate } from '../../data/quotationTemplate';
import { formatAmount, formatNumber } from '../../utils/format';

interface TemplateQuotationTableProps {
  doc: PrintableDocument;
  pageWidth: number;
  pageHeight: number;
}

interface SummaryRow {
  label: string;
  value: string;
  grand?: boolean;
}

/** Replaces the quotation table area of the proposal artwork with live quotation data. */
export function TemplateQuotationTable({ doc, pageWidth, pageHeight }: TemplateQuotationTableProps) {
  const { tableArea: a, colors } = quotationTemplate;
  const width = a.w * pageWidth;
  const height = a.h * pageHeight;

  const summary: SummaryRow[] = [
  { label: 'SUB TOTAL', value: `Rs. ${formatAmount(doc.subtotal)}` },
  ...doc.charges.map((c) => ({ label: c.label.toUpperCase(), value: `Rs. ${formatAmount(c.amount)}` })),
  { label: 'DISCOUNT', value: doc.discount > 0 ? `− Rs. ${formatAmount(doc.discount)}` : 'Rs. 0.00' },
  { label: doc.tax.amount > 0 ? doc.tax.label.toUpperCase() : 'VAT (IF APPLICABLE)', value: `Rs. ${formatAmount(doc.tax.amount)}` },
  { label: 'GRAND TOTAL', value: `Rs. ${formatAmount(doc.total)}`, grand: true }];


  const metaH = Math.round(height * 0.09);
  const rowCount = 1 + Math.max(doc.lines.length, 1) + summary.length + 0.3;
  const rowH = clamp(Math.floor((height - metaH - 2) / rowCount), 11, 26);
  const fs = clamp(rowH * 0.46, 6.5, 11.5);
  const border = `1px solid ${colors.line}`;
  const cell: React.CSSProperties = {
    border,
    height: rowH,
    padding: `0 ${Math.round(fs * 0.7)}px`,
    fontSize: fs,
    color: colors.ink,
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    overflow: 'hidden'
  };
  const center: React.CSSProperties = { ...cell, textAlign: 'center' };
  const right: React.CSSProperties = { ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
  const head: React.CSSProperties = { ...center, fontWeight: 600, letterSpacing: '0.04em' };

  return (
    <div
      style={{
        position: 'absolute',
        left: a.x * pageWidth,
        top: a.y * pageHeight,
        width,
        height,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column'
      }}>
      
      <div style={{ height: metaH, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: fs * 1.05, color: colors.ink }}>
        <span>
          <span style={{ fontWeight: 600 }}>QUOTATION NO :</span> {doc.number}
        </span>
        <span>
          <span style={{ fontWeight: 600 }}>DATE :</span> {doc.issueDate}
        </span>
        <span>
          <span style={{ fontWeight: 600 }}>VALID UNTIL :</span> {doc.dueDate}
        </span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '8%' }} />
          <col style={{ width: '38%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '17%' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={head}>ITEMS</th>
            <th style={head}>DESCRIPTION</th>
            <th style={head}>SIZE RANGE</th>
            <th style={head}>QTY</th>
            <th style={head}>UNIT PRICE</th>
            <th style={head}>TOTAL (LKR)</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.length === 0 ?
          <tr>
              <td style={center}>—</td>
              <td colSpan={5} style={cell}>
                No line items
              </td>
            </tr> :

          doc.lines.map((l, i) =>
          <tr key={i}>
                <td style={center}>{String(i + 1).padStart(2, '0')}</td>
                <td style={cell}>
                  {l.description}
                  {l.spec && <span style={{ color: '#6B6B6B' }}> — {l.spec}</span>}
                </td>
                <td style={center}>{l.size}</td>
                <td style={center}>{formatNumber(l.quantity)}</td>
                <td style={right}>{formatAmount(l.unitPrice)}</td>
                <td style={right}>{formatAmount(l.total)}</td>
              </tr>
          )
          }
          {summary.map((s) => {
            const grandStyle: React.CSSProperties = s.grand ?
            { background: colors.gold, fontWeight: 700, fontSize: fs * 1.12, height: Math.round(rowH * 1.3) } :
            { fontWeight: 600 };
            return (
              <tr key={s.label}>
                <td style={cell} />
                <td colSpan={3} style={cell} />
                <td style={{ ...cell, ...grandStyle }}>{s.label}</td>
                <td style={{ ...right, ...grandStyle }}>{s.value}</td>
              </tr>);

          })}
        </tbody>
      </table>
    </div>);

}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}