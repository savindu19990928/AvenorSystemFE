import React from 'react';

export function PrintParty({ label, name, lines }: {label: string;name: string;lines: (string | undefined | null)[];}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-faint">{label}</p>
      <p className="mt-0.5 font-semibold">{name || '—'}</p>
      {lines.filter(Boolean).map((l) =>
      <p key={l as string} className="text-muted">{l}</p>
      )}
    </div>);

}