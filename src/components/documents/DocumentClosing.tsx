import React from 'react';
import type { PrintableDocument } from '../../types/documents';
import { company, documentPalette as P, invoiceTerms, quotationTerms } from '../../data/company';
import { formatMoney } from '../../utils/format';

interface DocumentClosingProps {
  doc: PrintableDocument;
}

const label: React.CSSProperties = { fontSize: 8.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.faint };
const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 11 };
const amount: React.CSSProperties = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };

/** Totals, terms, bank details and signature — the tail of the last page. */
export function DocumentClosing({ doc }: DocumentClosingProps) {
  const terms = doc.kind === 'QUOTATION' ? quotationTerms : invoiceTerms;
  const isInvoice = doc.kind === 'INVOICE';

  return (
    <>
      <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 272px', gap: 36, alignItems: 'start' }}>
        <div style={{ fontSize: 10, lineHeight: 1.6, color: P.muted }}>
          {doc.paymentTerms &&
          <div style={{ marginBottom: 14 }}>
              <div style={label}>Payment terms</div>
              <div style={{ marginTop: 5, fontSize: 11, color: P.ink }}>{doc.paymentTerms}</div>
            </div>
          }
          {doc.notes &&
          <div style={{ marginBottom: 14 }}>
              <div style={label}>Notes</div>
              <div style={{ marginTop: 5, whiteSpace: 'pre-line' }}>{doc.notes}</div>
            </div>
          }
          <div style={label}>Terms &amp; conditions</div>
          <ol style={{ marginTop: 5, paddingLeft: 14, listStyle: 'decimal' }}>
            {terms.map((t) =>
            <li key={t} style={{ marginBottom: 2 }}>
                {t}
              </li>
            )}
          </ol>
        </div>

        <div>
          <div style={row}>
            <span style={{ color: P.muted }}>Subtotal</span>
            <span style={amount}>{formatMoney(doc.subtotal)}</span>
          </div>
          {doc.charges.map((c) =>
          <div key={c.label} style={row}>
              <span style={{ color: P.muted }}>{c.label}</span>
              <span style={amount}>{formatMoney(c.amount)}</span>
            </div>
          )}
          {doc.discount > 0 &&
          <div style={row}>
              <span style={{ color: P.muted }}>Discount</span>
              <span style={amount}>− {formatMoney(doc.discount)}</span>
            </div>
          }
          {doc.tax.amount > 0 &&
          <div style={row}>
              <span style={{ color: P.muted }}>{doc.tax.label}</span>
              <span style={amount}>{formatMoney(doc.tax.amount)}</span>
            </div>
          }
          <div
            style={{
              marginTop: 8,
              background: P.ink,
              borderRadius: 6,
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
            
            <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ffffff' }}>
              {isInvoice ? 'Invoice total' : 'Grand total'}
            </span>
            <span style={{ ...amount, fontSize: 16, fontWeight: 700, color: '#E7C27D' }}>{formatMoney(doc.total)}</span>
          </div>
          {isInvoice &&
          <>
              <div style={{ ...row, marginTop: 6 }}>
                <span style={{ color: P.muted }}>Paid to date</span>
                <span style={amount}>{formatMoney(doc.paid)}</span>
              </div>
              <div style={{ ...row, background: P.goldSoft, borderRadius: 6, padding: '9px 14px', fontWeight: 700, fontSize: 12 }}>
                <span>Balance due</span>
                <span style={amount}>{formatMoney(doc.balance)}</span>
              </div>
            </>
          }
        </div>
      </div>

      <div
        style={{
          marginTop: 'auto',
          paddingTop: 24,
          display: 'grid',
          gridTemplateColumns: '1fr 220px',
          gap: 36,
          alignItems: 'end'
        }}>
        
        <div style={{ borderTop: `1px solid ${P.line}`, paddingTop: 12 }}>
          <div style={label}>Bank details</div>
          <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '92px 1fr', rowGap: 3, fontSize: 10 }}>
            <span style={{ color: P.muted }}>Bank</span>
            <span>{company.bank.bank}</span>
            <span style={{ color: P.muted }}>Branch</span>
            <span>{company.bank.branch}</span>
            <span style={{ color: P.muted }}>Account name</span>
            <span>{company.bank.accountName}</span>
            <span style={{ color: P.muted }}>Account no.</span>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{company.bank.accountNumber}</span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ height: 44 }} />
          <div style={{ borderTop: `1px solid ${P.ink}`, paddingTop: 6, fontSize: 10, fontWeight: 600 }}>Authorised signature</div>
          <div style={{ fontSize: 9, color: P.muted, marginTop: 2 }}>For {company.name}</div>
        </div>
      </div>
    </>);

}