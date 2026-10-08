import React from 'react';
import { cx } from '../../utils/styles';

interface SegmentedControlProps<T extends string> {
  options: {value: T;label: string;}[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

export function SegmentedControl<T extends string>({ options, value, onChange, label }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-line bg-canvas p-0.5">
      {options.map((o) =>
      <button
        key={o.value}
        type="button"
        role="radio"
        aria-checked={value === o.value}
        onClick={() => onChange(o.value)}
        className={cx(
          'whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150',
          value === o.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
        )}>
        
          {o.label}
        </button>
      )}
    </div>);

}