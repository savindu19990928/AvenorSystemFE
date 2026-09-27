import React from 'react';
import { CheckIcon } from 'lucide-react';
import { useBrands } from '../../contexts/BrandContext';
import { isPremium } from '../ui/BrandTag';
import { cx } from '../../utils/styles';

interface BrandPickerProps {
  value: number | null;
  onChange: (id: number) => void;
  disabled?: boolean;
  error?: string;
}

export function BrandPicker({ value, onChange, disabled, error }: BrandPickerProps) {
  const { brands } = useBrands();
  return (
    <fieldset>
      <legend className="text-xs font-medium text-ink">
        Brand<span className="ml-0.5 text-danger">*</span>
      </legend>
      <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {brands.length === 0 && <p className="text-sm text-faint">Loading brands…</p>}
        {brands.map((b) => {
          const selected = value === b.id;
          const premium = isPremium(b.name);
          return (
            <button
              key={b.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(b.id)}
              aria-pressed={selected}
              className={cx(
                'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-[border-color,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-60',
                selected ?
                premium ?
                'border-premium bg-premium-soft' :
                'border-standard bg-standard-soft' :
                'border-line hover:border-line-strong'
              )}>
              
              <span
                className={cx(
                  'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                  selected ? premium ? 'border-premium bg-premium text-white' : 'border-standard bg-standard text-white' : 'border-line-strong'
                )}>
                
                {selected && <CheckIcon className="h-3 w-3" aria-hidden="true" />}
              </span>
              <span>
                <span className="block text-sm font-medium text-ink">{b.name}</span>
                <span className="block text-xs text-muted">{b.positioning}</span>
              </span>
            </button>);

        })}
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </fieldset>);

}