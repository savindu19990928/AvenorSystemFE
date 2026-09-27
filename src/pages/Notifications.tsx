import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheckIcon } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAction } from '../hooks/useAction';
import { api } from '../utils/api';
import type { AppNotification } from '../types/api';
import { timeAgo } from '../utils/format';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { StateMessage } from '../components/ui/StateMessage';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Tabs } from '../components/ui/Tabs';
import { cx } from '../utils/styles';

type Filter = 'unread' | 'all';

export function Notifications() {
  const [filter, setFilter] = useState<Filter>('unread');
  const { data, loading, error, reload } = useApi(
    () => api.list<AppNotification>('/api/core/notifications/', { is_read: filter === 'unread' ? false : undefined }),
    [filter]
  );
  const { run, pending } = useAction();

  const markRead = async (id: number) => {
    await run(() => api.post(`/api/core/notifications/${id}/mark_as_read/`));
    reload();
  };
  const markAll = async () => {
    await run(() => api.post('/api/core/notifications/mark_all_read/'), 'All notifications marked as read');
    reload();
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Delivery dates, overdue payments, low stock, pending artwork and deposits — filtered to your department."
        actions={<Button icon={CheckCheckIcon} onClick={markAll} loading={pending}>Mark all read</Button>} />
      
      <Panel flush>
        <div className="px-5 pt-2">
          <Tabs<Filter> tabs={[{ id: 'unread', label: 'Unread' }, { id: 'all', label: 'All' }]} active={filter} onChange={setFilter} />
        </div>
        {loading && !data ?
        <StateMessage kind="loading" /> :
        error ?
        <StateMessage kind="error" message={error} onRetry={reload} /> :
        !data || data.length === 0 ?
        <StateMessage kind="empty" title="You're all caught up" message="New alerts will appear here automatically." /> :

        <ul className="divide-y divide-line">
            {data.map((n) =>
          <li key={n.id} className={cx('flex items-start gap-4 px-5 py-4', !n.is_read && 'bg-accent-soft/30')}>
                <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.is_read ? 'bg-transparent' : 'bg-accent')} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{n.title}</p>
                    <StatusBadge status={n.severity} />
                  </div>
                  <p className="mt-1 text-sm text-muted">{n.message}</p>
                  <p className="mt-1.5 text-xs text-faint">
                    {timeAgo(n.created_at)}
                    {n.order_id &&
                <>
                        {' · '}
                        <Link to={`/orders?search=${n.order_id}`} className="font-mono text-accent hover:underline">{n.order_id}</Link>
                      </>
                }
                  </p>
                </div>
                {!n.is_read &&
            <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                    Mark read
                  </Button>
            }
              </li>
          )}
          </ul>
        }
      </Panel>
    </div>);

}