import React from 'react';

export function PrintSignatures({ labels }: {labels: string[];}) {
  return (
    <div className="print-avoid-break grid grid-cols-2 gap-12 pt-12 text-xs text-muted">
      {labels.map((l) =>
      <div key={l} className="border-t border-line-strong pt-2">
          {l}
          <span className="mt-4 block">Date</span>
        </div>
      )}
    </div>);

}