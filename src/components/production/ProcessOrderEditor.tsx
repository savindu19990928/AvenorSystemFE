import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon, XIcon, PlusIcon, RotateCcwIcon } from 'lucide-react';
import type { StageName } from '../../types/api';
import type { ProcessConfig } from '../../types/production';
import { DEFAULT_PROCESS_ORDER } from '../../data/workflow';
import { stageLabel } from '../../utils/production';
import { cx, inputClass } from '../../utils/styles';

interface ProcessOrderEditorProps {
  value: ProcessConfig;
  onChange: (value: ProcessConfig) => void;
  idPrefix?: string;
}

const iconBtn =
'inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-out hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-30';

export function ProcessOrderEditor({ value, onChange, idPrefix = 'proc' }: ProcessOrderEditorProps) {
  const reduceMotion = useReducedMotion();
  const { order, startFrom } = value;
  const startIdx = order.indexOf(startFrom);
  const missing = DEFAULT_PROCESS_ORDER.filter((s) => !order.includes(s));
  const isDefault = order.join() === DEFAULT_PROCESS_ORDER.join() && startFrom === order[0];

  const commit = (next: StageName[], start: StageName = startFrom) => onChange({ order: next, startFrom: next.includes(start) ? start : next[0] });

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  const remove = (stage: StageName) => {
    if (order.length <= 1) return;
    commit(order.filter((s) => s !== stage));
  };

  const add = (stage: StageName) => {
    const rank = DEFAULT_PROCESS_ORDER.indexOf(stage);
    const at = order.findIndex((s) => DEFAULT_PROCESS_ORDER.indexOf(s) > rank);
    const next = [...order];
    next.splice(at === -1 ? next.length : at, 0, stage);
    commit(next);
  };

  return (
    <div className="rounded-lg border border-line">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <div>
          <p className="text-xs font-medium text-ink">Production process</p>
          <p className="text-[11px] text-muted">Every step is optional — keep at least one. Reorder with the arrows.</p>
        </div>
        {!isDefault &&
        <button
          type="button"
          onClick={() => onChange({ order: [...DEFAULT_PROCESS_ORDER], startFrom: DEFAULT_PROCESS_ORDER[0] })}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-accent transition-colors duration-150 ease-out hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
          
            <RotateCcwIcon className="h-3.5 w-3.5" aria-hidden /> Standard order
          </button>
        }
      </div>

      <ol className="divide-y divide-line">
        {order.map((stage, i) => {
          const skipped = i < startIdx;
          const label = stageLabel(stage);
          return (
            <motion.li
              key={stage}
              layout={!reduceMotion}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className={cx('flex items-center gap-3 bg-surface px-3 py-1.5', skipped && 'bg-canvas/60')}>
              
              <span className="w-4 text-xs tabular-nums text-faint">{i + 1}</span>
              <span className={cx('flex-1 text-sm font-medium', skipped ? 'text-faint line-through' : 'text-ink')}>{label}</span>
              {skipped && <span className="hidden text-[11px] text-faint sm:inline">Skipped · uses stored stock</span>}
              {i === startIdx && startIdx > 0 &&
              <span className="whitespace-nowrap rounded-full bg-info-soft px-2 py-0.5 text-[11px] font-medium text-info">Starts here</span>
              }
              <div className="flex items-center">
                <button type="button" className={iconBtn} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${label} earlier`}>
                  <ArrowUpIcon className="h-3.5 w-3.5" />
                </button>
                <button type="button" className={iconBtn} disabled={i === order.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${label} later`}>
                  <ArrowDownIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className={iconBtn}
                  disabled={order.length <= 1}
                  onClick={() => remove(stage)}
                  aria-label={`Remove ${label}`}
                  title={order.length <= 1 ? 'At least one step is required' : undefined}>
                  
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.li>);

        })}
      </ol>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-3 py-2.5">
        {missing.length > 0 &&
        <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted">Add</span>
            {missing.map((s) =>
          <button
            key={s}
            type="button"
            onClick={() => add(s)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-line-strong px-2 py-0.5 text-xs font-medium text-muted transition-colors duration-150 ease-out hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
            
                <PlusIcon className="h-3 w-3" aria-hidden /> {stageLabel(s)}
              </button>
          )}
          </div>
        }
        <label htmlFor={`${idPrefix}-start`} className="ml-auto flex items-center gap-2 whitespace-nowrap text-xs text-muted">
          Start from
          <select
            id={`${idPrefix}-start`}
            className={cx(inputClass, 'w-auto py-1.5')}
            value={startFrom}
            onChange={(e) => onChange({ order, startFrom: e.target.value as StageName })}>
            
            {order.map((s) =>
            <option key={s} value={s}>{stageLabel(s)}</option>
            )}
          </select>
        </label>
      </div>
    </div>);

}