import React from 'react';
import { cx } from '../../utils/styles';

export function isPremium(name?: string | null): boolean {
  return (name ?? '').toLowerCase().includes('premium');
}

export function BrandTag({ name, className }: {name?: string | null;className?: string;}) {
  if (!name) return <span className="text-xs text-faint">No brand</span>;
  const premium = isPremium(name);
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium',
        premium ? 'bg-premium-soft text-premium' : 'bg-standard-soft text-standard',
        className
      )}>
      
      <span className={cx('h-1.5 w-1.5 rounded-full', premium ? 'bg-premium' : 'bg-standard')} aria-hidden="true" />
      {name.replace(/ Brand$/, '')}
    </span>);

}