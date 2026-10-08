import React from 'react';
import type { BrandIdentity } from '../../../types/print';
import { company } from '../../../data/company';
import { BrandLogo } from './BrandLogo';
import { DocLabel } from './DocLabel';

interface PartyPanelsProps {
  partyLabel: string;
  partyName: string;
  partyLines: (string | undefined | null)[];
  brand: BrandIdentity;
}

/** Customer on the left, the issuing brand (with its small mark) on the right. */
export function PartyPanels({ partyLabel, partyName, partyLines, brand }: PartyPanelsProps) {
  return (
    <div className="grid grid-cols-2 border border-doc-rule bg-doc-panel">
      <div className="px-3.5 py-3">
        <DocLabel>{partyLabel}</DocLabel>
        <p className="mt-1 text-[16px] font-bold text-doc-navy">{partyName || '—'}</p>
        {partyLines.filter(Boolean).map((l) =>
        <p key={l as string}>{l}</p>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 border-l border-doc-rule px-3.5 py-3">
        <div className="min-w-0">
          <DocLabel>Brand / Project</DocLabel>
          <p className="mt-1 text-[16px] font-bold uppercase text-doc-navy">{brand.name}</p>
          <p>Registered brand of {brand.company || company.legalName}</p>
        </div>
        <BrandLogo name={brand.name} code={brand.code} logo={brand.logo} size={44} />
      </div>
    </div>);

}