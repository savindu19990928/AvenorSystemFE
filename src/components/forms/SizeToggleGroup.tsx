import React from 'react';
import { SIZES } from '../../data/workflow';
import { cx } from '../../utils/styles';

interface SizeToggleGroupProps {
  value: string[];
  onChange: (sizes: string[]) => void;
  labelId?: string;
}

export function SizeToggleGroup({ value, onChange, labelId }: SizeToggleGroupProps) {
  const toggle = (size: string) => {
    const next = value.includes(size) ? value.filter((s) => s !== size) : [...value, size];
    onChange(SIZES.filter((s) => next.includes(s)));
  };

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-1">
      {SIZES.map((size) => {
        const on = value.includes(size);
        return (
          <button
            key={size}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(size)}
            className={cx(
              'h-8 min-w-[2.5rem] rounded-md border px-2 text-xs font-medium transition-[background-color,border-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
              on ? 'border-accent bg-accent text-white' : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink'
            )}>
            
            {size}
          </button>);

      })}
    </div>);

}