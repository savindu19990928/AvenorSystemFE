import React from 'react';

export function CommercialSignatures({ labels, footnote }: {labels: string[];footnote?: string;}) {
  return (
    <div className="print-avoid-break">
      {footnote && <p className="text-[11px] italic leading-snug text-muted">{footnote}</p>}
      <div className="mt-1.5 grid grid-cols-2 gap-12 border-t border-doc-rule px-2 pt-2.5">
        {labels.map((l) =>
        <div key={l}>
            <p className="text-[11px] font-bold uppercase text-doc-navy">{l}</p>
            <div className="mt-7 w-52 border-b border-faint" />
            <p className="mt-1 text-[10px] text-muted">Name / Signature / Date</p>
          </div>
        )}
      </div>
    </div>);

}