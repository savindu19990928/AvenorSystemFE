import React from 'react';
import type { DocLine } from '../../types/documents';
import { documentPalette as P } from '../../data/company';
import { formatAmount, formatNumber } from '../../utils/format';

interface DocumentItemsTableProps {
  lines: DocLine[];
  startIndex: number;
}

const th: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 8.5,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#ffffff',
  textAlign: 'left'
};
const td: React.CSSProperties = { padding: '10px 12px', fontSize: 11, verticalAlign: 'top', borderBottom: `1px solid ${P.line}` };
const num: React.CSSProperties = { textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };

export function DocumentItemsTable({ lines, startIndex }: DocumentItemsTableProps) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: 38 }} />
        <col />
        <col style={{ width: 82 }} />
        <col style={{ width: 56 }} />
        <col style={{ width: 96 }} />
        <col style={{ width: 106 }} />
      </colgroup>
      <thead>
        <tr style={{ background: P.ink }}>
          <th style={th}>#</th>
          <th style={th}>Description</th>
          <th style={th}>Size</th>
          <th style={{ ...th, textAlign: 'right' }}>Qty</th>
          <th style={{ ...th, textAlign: 'right' }}>Unit price</th>
          <th style={{ ...th, textAlign: 'right' }}>Amount (LKR)</th>
        </tr>
      </thead>
      <tbody>
        {lines.length === 0 ?
        <tr>
            <td colSpan={6} style={{ ...td, color: P.muted, textAlign: 'center' }}>
              No line items
            </td>
          </tr> :

        lines.map((l, i) =>
        <tr key={startIndex + i}>
              <td style={{ ...td, color: P.faint, fontVariantNumeric: 'tabular-nums' }}>{String(startIndex + i + 1).padStart(2, '0')}</td>
              <td style={td}>
                <div style={{ fontWeight: 600, lineHeight: 1.35 }}>{l.description}</div>
                {l.spec && <div style={{ marginTop: 2, fontSize: 9.5, color: P.muted, lineHeight: 1.4 }}>{l.spec}</div>}
              </td>
              <td style={{ ...td, color: P.muted }}>{l.size}</td>
              <td style={{ ...td, ...num }}>{formatNumber(l.quantity)}</td>
              <td style={{ ...td, ...num }}>{formatAmount(l.unitPrice)}</td>
              <td style={{ ...td, ...num, fontWeight: 600 }}>{formatAmount(l.total)}</td>
            </tr>
        )
        }
      </tbody>
    </table>);

}