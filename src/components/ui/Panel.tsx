import React from 'react';
import { cx } from '../../utils/styles';

interface PanelProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  flush?: boolean;
  className?: string;
}

export function Panel({ title, description, actions, children, flush, className }: PanelProps) {
  return (
    <section className={cx('rounded-xl border border-line bg-surface', className)}>
      {(title || actions) &&
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      }
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>);

}