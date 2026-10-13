import React from 'react';
import { CheckIcon, PlayIcon, FlagIcon, ArchiveIcon, PackagePlusIcon } from 'lucide-react';
import type { ProductionStage } from '../../types/api';
import { formatDateTime, formatNumber, humanize } from '../../utils/format';
import { stageLabel, stagesBefore } from '../../utils/production';
import { Button } from '../ui/Button';
import { cx } from '../../utils/styles';

interface StageTrackProps {
  stages: ProductionStage[];
  canAct: boolean;
  onStart: (stage: ProductionStage) => void;
  onComplete: (stage: ProductionStage, next: ProductionStage | null) => void;
  /** Add stored semi-finished stock into this step. */
  onAddWip?: (stage: ProductionStage) => void;
}

export function StageTrack({ stages, canAct, onStart, onComplete, onAddWip }: StageTrackProps) {
  const sorted = [...stages].sort((a, b) => (a.sequence_order ?? 0) - (b.sequence_order ?? 0));
  const active = sorted.filter((s) => s.status !== 'SKIPPED');
  return (
    <ol className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
      {sorted.map((s, i) => {
        const skipped = s.status === 'SKIPPED';
        const pos = active.indexOf(s);
        const prev = pos > 0 ? active[pos - 1] : null;
        const next = pos >= 0 ? active[pos + 1] ?? null : null;
        const canStart = canAct && !!s.id && s.status === 'PENDING' && (!prev || prev.status === 'COMPLETED' || prev.status === 'IN_PROGRESS');
        const canComplete = canAct && !!s.id && s.status === 'IN_PROGRESS';
        const target = s.target_quantity ?? 0;
        const pct = target ? Math.min(100, s.completed_quantity / target * 100) : s.status === 'COMPLETED' ? 100 : 0;
        const extraMade = s.extra_pieces ?? s.extra_quantity ?? 0;
        const stored = s.semi_finished_count ?? s.quantity_to_inventory ?? 0;
        const canAddWip = canAct && !!onAddWip && !!s.id && (s.status === 'PENDING' || s.status === 'IN_PROGRESS') && stagesBefore(s.stage_name).length > 0;
        return (
          <li
            key={s.id ?? s.stage_name}
            className={cx(
              'flex flex-col rounded-lg border p-3',
              s.status === 'IN_PROGRESS' ? 'border-info/40 bg-info-soft/40' : s.status === 'COMPLETED' ? 'border-line bg-surface' : 'border-dashed border-line-strong bg-canvas/50',
              skipped && 'opacity-60'
            )}>
            
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-faint tabular-nums">{s.sequence_order ?? i + 1}</span>
              {s.status === 'COMPLETED' ?
              <CheckIcon className="h-4 w-4 text-ok" aria-label="Completed" /> :

              <span className={cx('text-[11px] font-medium', s.status === 'IN_PROGRESS' ? 'text-info' : 'text-faint')}>
                  {skipped ? 'Skipped · stored stock' : humanize(s.status)}
                </span>
              }
            </div>
            <p className="mt-1 text-sm font-semibold text-ink">{s.stage_name_display ?? stageLabel(s.stage_name)}</p>
            {!skipped &&
            <>
                <div className="mt-2 h-1.5 rounded-full bg-line/70">
                  <div className={cx('h-full rounded-full', s.status === 'COMPLETED' ? 'bg-ok' : 'bg-info')} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted tabular-nums">
                  {formatNumber(s.completed_quantity)}
                  {target ? ` / ${formatNumber(target)}` : ''} done
                  {s.damaged_quantity ? <span className="text-danger"> · {s.damaged_quantity} damaged</span> : null}
                </p>
              </>
            }
            {(stored > 0 || extraMade > 0) &&
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-accent">
                <ArchiveIcon className="h-3 w-3 shrink-0" aria-hidden /> {formatNumber(stored)} semi-finished stored
              </p>
            }
            {extraMade > 0 &&
            <p className="text-[11px] text-faint tabular-nums">
                {formatNumber(extraMade)} extra − {formatNumber(s.damaged_quantity ?? 0)} damaged
              </p>
            }
            {s.assigned_staff_name && <p className="mt-0.5 truncate text-[11px] text-faint">{s.assigned_staff_name} · {formatDateTime(s.start_time)}</p>}
            {s.damaged_reason && <p className="mt-1 text-[11px] text-danger">{s.damaged_reason}</p>}
            <div className="mt-auto space-y-1.5 pt-3">
              {canStart && <Button size="sm" icon={PlayIcon} className="w-full" onClick={() => onStart(s)}>Start</Button>}
              {canComplete && <Button size="sm" variant="primary" icon={FlagIcon} className="w-full" onClick={() => onComplete(s, next)}>Complete</Button>}
              {canAddWip &&
              <Button size="sm" variant="ghost" icon={PackagePlusIcon} className="w-full" onClick={() => onAddWip?.(s)}>
                  Add stored stock
                </Button>
              }
            </div>
          </li>);

      })}
    </ol>);

}