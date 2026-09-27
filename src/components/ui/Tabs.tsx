import React from 'react';
import { cx } from '../../utils/styles';

interface TabsProps<T extends string> {
  tabs: {id: T;label: string;count?: number;}[];
  active: T;
  onChange: (id: T) => void;
}

export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) =>
      <button
        key={t.id}
        role="tab"
        type="button"
        aria-selected={active === t.id}
        onClick={() => onChange(t.id)}
        className={cx(
          '-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors duration-150',
          active === t.id ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
        )}>
        
          {t.label}
          {t.count !== undefined &&
        <span className="rounded-full bg-canvas px-1.5 text-xs text-muted tabular-nums">{t.count}</span>
        }
        </button>
      )}
    </div>);

}