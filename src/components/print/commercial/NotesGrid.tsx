import React from 'react';
import type { DocNote } from '../../../types/print';
import { cx } from '../../../utils/styles';
import { DocLabel } from './DocLabel';

export function NotesGrid({ title, notes }: {title: string;notes: DocNote[];}) {
  return (
    <section className="print-avoid-break">
      <h2 className="text-[13px] font-bold uppercase text-doc-navy">{title}</h2>
      <div className="mt-1.5 grid grid-cols-2 border border-doc-rule bg-doc-panel">
        {notes.map((n, i) =>
        <div key={n.label} className={cx('px-2.5 py-2', i % 2 === 1 && 'border-l border-doc-rule', i >= 2 && 'border-t border-doc-rule')}>
            <DocLabel>{n.label}</DocLabel>
            <p className="mt-0.5 text-[11.5px] leading-snug">{n.text}</p>
          </div>
        )}
      </div>
    </section>);

}