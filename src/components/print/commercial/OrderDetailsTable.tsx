import React from 'react';
import type { CommercialLine } from '../../../types/print';
import { formatAmount } from '../../../utils/format';
import { cx } from '../../../utils/styles';

export function OrderDetailsTable({ lines }: { lines: CommercialLine[] }) {
  const fillerCount = Math.max(0, 5 - lines.length);

  return (
    <section>
      <div className="w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#0b2545] text-[12px] font-bold uppercase tracking-wider text-white">
              <th className="w-[72%] px-4 py-2.5 text-left">ITEM DESCRIPTION</th>
              <th className="w-[28%] px-6 py-2.5 text-right">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={2} className="border-b border-[#dbe7f2] py-6 text-center text-muted">
                  No line items
                </td>
              </tr>
            ) : (
              lines.map((l, idx) => {
                const isEven = idx % 2 === 0;
                const bracket =
                  l.sizes || l.quantity
                    ? `[ ${[l.sizes, l.quantity ? `(${l.quantity}QTY)` : ''].filter(Boolean).join(' ')} ]`
                    : '';
                const title = [l.description, bracket, 'Per unit'].filter(Boolean).join(' ');

                return (
                  <tr
                    key={idx}
                    className={cx(
                      'border-b border-[#dbe7f2] align-top text-[12px]',
                      isEven ? 'bg-white' : 'bg-[#ebf3f9]'
                    )}
                  >
                    <td className="border-r border-[#cddfe9] px-4 py-2.5 font-medium text-ink">
                      <p className="font-semibold text-ink">{title}</p>
                      {l.details.map((d) => (
                        <p key={d} className="mt-0.5 text-[10.5px] text-muted">
                          {d}
                        </p>
                      ))}
                    </td>
                    <td className="px-6 py-2.5 text-right font-semibold tabular-nums text-ink">
                      LKR{formatAmount(l.total_price || l.unit_price)}
                    </td>
                  </tr>
                );
              })
            )}

            {Array.from({ length: fillerCount }).map((_, fIdx) => {
              const rowIdx = lines.length + fIdx;
              const isEven = rowIdx % 2 === 0;
              return (
                <tr
                  key={`filler-${fIdx}`}
                  className={cx(
                    'h-[38px] border-b border-[#dbe7f2]',
                    isEven ? 'bg-white' : 'bg-[#ebf3f9]'
                  )}
                >
                  <td className="border-r border-[#cddfe9] px-4 py-2.5">&nbsp;</td>
                  <td className="px-6 py-2.5 text-right">&nbsp;</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="h-[2.5px] w-full bg-[#005a9c]" />
      </div>
    </section>
  );
}