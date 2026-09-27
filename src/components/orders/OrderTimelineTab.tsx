import React from 'react';
import type { AuditEntry } from '../../types/api';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { formatDateTime, humanize } from '../../utils/format';
import { StateMessage } from '../ui/StateMessage';

export function OrderTimelineTab({ orderId }: {orderId: number;}) {
  const { data, loading, error, reload } = useApi(() => api.list<AuditEntry>(`/api/orders/orders/${orderId}/timeline/`), [orderId]);
  if (loading && !data) return <StateMessage kind="loading" />;
  if (error) return <StateMessage kind="error" message={error} onRetry={reload} />;
  if (!data?.length) return <StateMessage kind="empty" title="No history yet" />;

  const events = [...data].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return (
    <ol className="relative p-5">
      {events.map((e, i) =>
      <li key={e.id} className="relative flex gap-4 pb-5 last:pb-0">
          {i < events.length - 1 && <span className="absolute left-[5px] top-3 h-full w-px bg-line" aria-hidden="true" />}
          <span className="relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-surface bg-ink/70 ring-1 ring-line" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink">
              <span className="font-medium">{e.user_name}</span> <span className="text-muted">{humanize(e.action).toLowerCase()}</span>
            </p>
            {e.field_name &&
          <p className="mt-0.5 text-sm">
                <span className="text-muted">{humanize(e.field_name)}:</span>{' '}
                <span className="text-faint line-through">{e.old_value ? humanize(e.old_value) : '—'}</span>{' '}
                → <span className="font-medium">{e.new_value ? humanize(e.new_value) : '—'}</span>
              </p>
          }
            <p className="mt-0.5 text-xs text-faint">{formatDateTime(e.timestamp)}</p>
          </div>
        </li>
      )}
    </ol>);

}