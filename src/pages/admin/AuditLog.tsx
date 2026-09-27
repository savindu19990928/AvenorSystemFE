import React, { useState } from 'react';
import { useBrands } from '../../contexts/BrandContext';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { api } from '../../utils/api';
import type { AuditEntry } from '../../types/api';
import { formatDateTime, humanize } from '../../utils/format';
import { ROLE_LABELS } from '../../data/workflow';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { DataTable } from '../../components/ui/DataTable';
import { BrandTag } from '../../components/ui/BrandTag';
import { inputClass } from '../../utils/styles';
import type { Role } from '../../types/api';

const ACTIONS = ['ORDER_STATUS_TRANSITION', 'CREATE_ORDER', 'APPROVE_AND_LOCK_ARTWORK', 'RECEIVE_STOCK', 'UPDATE', 'CREATE', 'DELETE'];

export function AuditLogPage() {
  const { scopedBrand } = useBrands();
  const [orderId, setOrderId] = useState('');
  const [action, setAction] = useState('');
  const order = useDebounce(orderId.trim());
  const { data, loading, error, reload } = useApi(
    () => api.list<AuditEntry>('/api/core/audit-logs/', { order_id: order, action, brand_name: scopedBrand?.name }),
    [order, action, scopedBrand?.name]
  );

  return (
    <div>
      <PageHeader title="Audit log" description="Who changed what, when — with the old and new value. Important records are never hard-deleted." />
      <Panel flush>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
          <input aria-label="Order ID" placeholder="Filter by Order ID" className={`${inputClass} sm:w-64`} value={orderId} onChange={(e) => setOrderId(e.target.value)} />
          <select aria-label="Action" className={`${inputClass} sm:w-64`} value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">All actions</option>
            {ACTIONS.map((a) => <option key={a} value={a}>{humanize(a)}</option>)}
          </select>
        </div>
        <DataTable
          rows={data}
          loading={loading}
          error={error}
          onRetry={reload}
          getRowKey={(e) => e.id}
          emptyTitle="No audit entries match"
          columns={[
          { key: 'when', header: 'When', render: (e) => <span className="whitespace-nowrap text-muted">{formatDateTime(e.timestamp)}</span> },
          {
            key: 'who',
            header: 'Who',
            render: (e) =>
            <div>
                  <p className="font-medium">{e.user_name}</p>
                  {e.user_role && <p className="text-xs text-faint">{ROLE_LABELS[e.user_role as Role] ?? e.user_role}</p>}
                </div>

          },
          {
            key: 'what',
            header: 'What',
            render: (e) =>
            <div>
                  <p>{humanize(e.action)}</p>
                  <p className="text-xs text-muted">{e.object_repr}{e.field_name ? ` · ${humanize(e.field_name)}` : ''}</p>
                </div>

          },
          {
            key: 'change',
            header: 'Old → New',
            render: (e) =>
            e.field_name ?
            <span className="text-sm">
                    <span className="text-faint line-through">{e.old_value ?? '—'}</span> → <span className="font-medium">{e.new_value ?? '—'}</span>
                  </span> :

            <span className="text-faint">—</span>

          },
          { key: 'order', header: 'Order', render: (e) => <span className="font-mono text-xs">{e.order_id ?? '—'}</span> },
          { key: 'brand', header: 'Brand', render: (e) => e.brand_name ? <BrandTag name={e.brand_name} /> : <span className="text-faint">—</span> },
          { key: 'ip', header: 'IP', render: (e) => <span className="font-mono text-xs text-faint">{e.ip_address ?? ''}</span> }]
          } />
        
      </Panel>
    </div>);

}