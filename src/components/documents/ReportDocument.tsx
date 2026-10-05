import React from 'react';
import type { BrandIdentity, ReportSpec } from '../../types/print';
import { formatCell } from '../../utils/format';
import { cx } from '../../utils/styles';
import { DocumentPaper } from '../print/DocumentPaper';

export function ReportDocument({ spec, brand }: {spec: ReportSpec;brand: BrandIdentity;}) {
  return (
    <DocumentPaper brand={brand} title={spec.title} meta={spec.summary}>
      {spec.subtitle && <p className="text-muted">{spec.subtitle}</p>}
      {spec.sections.map((sec, si) => {
        const dense = sec.columns.length > 7;
        const cell = dense ? 'px-1 py-1.5 text-[10px]' : 'px-2 py-2 text-xs';
        const right = (i: number) => sec.columns[i]?.format && sec.columns[i].format !== 'text';
        return (
          <section key={sec.title ?? si}>
            {sec.title && <h2 className="mb-2 text-sm font-semibold">{sec.title}</h2>}
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-ink text-muted">
                  {sec.columns.map((c, i) =>
                  <th key={c.header + i} className={cx(cell, 'font-medium first:pl-0 last:pr-0', right(i) ? 'text-right' : 'text-left')}>{c.header}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sec.rows.length === 0 ?
                <tr>
                    <td colSpan={sec.columns.length} className="py-4 text-center text-xs text-muted">{sec.emptyText ?? 'No data'}</td>
                  </tr> :

                sec.rows.map((r, ri) =>
                <tr key={ri} className="print-avoid-break border-b border-line">
                      {r.map((v, i) =>
                  <td key={i} className={cx(cell, 'first:pl-0 last:pr-0', right(i) && 'whitespace-nowrap text-right tabular-nums')}>
                          {formatCell(v, sec.columns[i]?.format)}
                        </td>
                  )}
                    </tr>
                )
                }
              </tbody>
              {sec.footer && sec.rows.length > 0 &&
              <tfoot>
                  <tr className="border-t-2 border-ink font-semibold">
                    {sec.footer.map((v, i) =>
                  <td key={i} className={cx(cell, 'first:pl-0 last:pr-0', right(i) && 'whitespace-nowrap text-right tabular-nums')}>
                        {v === '' || v === null || v === undefined ? '' : formatCell(v, sec.columns[i]?.format)}
                      </td>
                  )}
                  </tr>
                </tfoot>
              }
            </table>
          </section>);

      })}
    </DocumentPaper>);

}