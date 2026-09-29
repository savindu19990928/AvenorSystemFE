import React from 'react';
import { CheckIcon } from 'lucide-react';
import type { QuotationLayout } from '../../types/documents';
import { company } from '../../data/company';
import { quotationTemplate } from '../../data/quotationTemplate';
import { cx } from '../../utils/styles';

interface QuotationLayoutPickerProps {
  value: QuotationLayout;
  onChange: (layout: QuotationLayout) => void;
}

const OPTIONS: {id: QuotationLayout;title: string;description: string;meta: string;}[] = [
{
  id: 'full',
  title: 'Company quotation',
  description: 'Avenor letterhead with company and customer details, brand identity, itemised pricing, terms, bank details and signature.',
  meta: 'A4 portrait'
},
{
  id: 'template',
  title: 'Brand proposal',
  description: 'Your proposal artwork with this quotation’s pricing placed into the quotation table and the customer on the cover.',
  meta: '4 landscape pages'
}];


export function QuotationLayoutPicker({ value, onChange }: QuotationLayoutPickerProps) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">Choose a layout</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((o) => {
          const selected = value === o.id;
          return (
            <label
              key={o.id}
              className={cx(
                'relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-surface transition-[border-color,box-shadow] duration-150 ease-out',
                selected ? 'border-accent ring-2 ring-accent/20' : 'border-line hover:border-line-strong'
              )}>
              
              <input type="radio" name="quotation-layout" value={o.id} checked={selected} onChange={() => onChange(o.id)} className="sr-only" />
              <div className="flex h-40 items-center justify-center bg-canvas">
                {o.id === 'full' ? <LetterheadThumb /> : <img src={quotationTemplate.image} alt="" className="h-32 w-auto rounded shadow-sm" />}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{o.title}</span>
                  <span
                    className={cx(
                      'flex h-5 w-5 items-center justify-center rounded-full border transition-colors duration-150',
                      selected ? 'border-accent bg-accent text-white' : 'border-line-strong bg-surface text-transparent'
                    )}
                    aria-hidden="true">
                    
                    <CheckIcon className="h-3 w-3" />
                  </span>
                </div>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-muted">{o.description}</p>
                <p className="mt-3 text-xs font-medium text-faint">{o.meta}</p>
              </div>
            </label>);

        })}
      </div>
    </fieldset>);

}

function LetterheadThumb() {
  return (
    <div className="flex h-32 w-[92px] flex-col overflow-hidden rounded bg-white shadow-sm" aria-hidden="true">
      <div className="h-1.5 bg-[#0F1A2B]" />
      <div className="h-px bg-[#B8893B]" />
      <div className="flex flex-1 flex-col gap-1.5 p-2">
        <div className="flex items-center gap-1">
          <img src={company.logo} alt="" className="h-3.5 w-3.5 object-contain" />
          <div className="h-1 w-8 rounded-full bg-[#0F1A2B]" />
        </div>
        <div className="h-0.5 w-10 rounded-full bg-line" />
        <div className="mt-0.5 flex gap-1">
          <div className="h-3 flex-1 rounded-sm bg-canvas" />
          <div className="h-3 flex-1 rounded-sm bg-canvas" />
        </div>
        <div className="mt-0.5 h-1.5 rounded-sm bg-[#0F1A2B]" />
        {[0, 1, 2, 3].map((i) =>
        <div key={i} className="h-0.5 rounded-full bg-line" />
        )}
        <div className="mt-auto ml-auto h-2 w-8 rounded-sm bg-[#0F1A2B]" />
      </div>
    </div>);

}