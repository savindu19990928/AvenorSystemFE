import React from 'react';
import { CheckIcon } from 'lucide-react';
import type { OrderStatus } from '../../types/api';
import { ORDER_PIPELINE, PIPELINE_PHASES } from '../../data/workflow';
import { humanize } from '../../utils/format';
import { cx } from '../../utils/styles';

export function OrderPipeline({ status }: {status: OrderStatus;}) {
  const cancelled = status === 'CANCELLED';
  const currentIdx = ORDER_PIPELINE.indexOf(status);

  return (
    <ol className="grid grid-cols-7 gap-1.5" aria-label="Order progress">
      {PIPELINE_PHASES.map((phase) => {
        const idxs = phase.statuses.map((s) => ORDER_PIPELINE.indexOf(s));
        const done = !cancelled && currentIdx > Math.max(...idxs);
        const active = !cancelled && phase.statuses.includes(status);
        const stepInPhase = active ? phase.statuses.indexOf(status) + 1 : 0;
        return (
          <li key={phase.label} className="min-w-0" aria-current={active ? 'step' : undefined}>
            <div className="flex gap-0.5">
              {phase.statuses.map((s) => {
                const i = ORDER_PIPELINE.indexOf(s);
                return (
                  <span
                    key={s}
                    className={cx(
                      'h-1.5 flex-1 rounded-full',
                      cancelled ? 'bg-line' : i < currentIdx ? 'bg-accent' : i === currentIdx ? 'bg-ink' : 'bg-line'
                    )} />);


              })}
            </div>
            <div className="mt-2 flex items-center gap-1">
              {done && <CheckIcon className="h-3 w-3 shrink-0 text-accent" aria-hidden="true" />}
              <span className={cx('truncate text-xs', active ? 'font-semibold text-ink' : done ? 'text-muted' : 'text-faint')}>{phase.label}</span>
            </div>
            {active && phase.statuses.length > 1 &&
            <p className="truncate text-[11px] text-muted">
                {humanize(status)} · {stepInPhase}/{phase.statuses.length}
              </p>
            }
          </li>);

      })}
    </ol>);

}