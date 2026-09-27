import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LockIcon, UploadIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { api, fileUrl } from '../../utils/api';
import type { Artwork } from '../../types/api';
import { formatDateTime, humanize } from '../../utils/format';
import { ARTWORK_STATUSES } from '../../data/workflow';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Tabs } from '../../components/ui/Tabs';
import { ArtworkActions } from '../../components/artwork/ArtworkActions';
import { ArtworkUploadModal } from '../../components/workflow/ArtworkUploadModal';

export function ArtworkPage() {
  const { hasRole } = useAuth();
  const [status, setStatus] = useState(hasRole('PRODUCTION') ? 'APPROVED' : '');
  const [uploading, setUploading] = useState(false);
  const { data, loading, error, reload } = useApi(() => api.list<Artwork>('/api/artworks/artworks/', { status }), [status]);

  return (
    <div>
      <PageHeader
        title="Artwork & approval"
        description="Once a customer approves a design it's locked, so the factory floor only ever prints the approved version."
        actions={hasRole('ADMIN', 'SALES') && <Button variant="primary" icon={UploadIcon} onClick={() => setUploading(true)}>Upload artwork</Button>} />
      
      <Panel flush>
        <div className="px-4 pt-1">
          <Tabs tabs={[{ id: '', label: 'All' }, ...ARTWORK_STATUSES.map((s) => ({ id: s, label: humanize(s) }))]} active={status} onChange={setStatus} />
        </div>
        <DataTable
          rows={data}
          loading={loading}
          error={error}
          onRetry={reload}
          getRowKey={(a) => a.id}
          emptyTitle="No artwork in this state"
          columns={[
          {
            key: 'title',
            header: 'Artwork',
            render: (a) =>
            <div>
                  <p className="flex items-center gap-1.5 font-medium">
                    {a.title}
                    {a.is_locked && <LockIcon className="h-3.5 w-3.5 text-ok" aria-label="Locked" />}
                  </p>
                  <p className="text-xs text-muted">v{a.version}{a.placement ? ` · ${a.placement}` : ''}{a.color_codes ? ` · ${a.color_codes}` : ''}</p>
                </div>

          },
          {
            key: 'order',
            header: 'Order',
            render: (a) => <Link to={`/orders/${a.order}`} className="font-mono text-xs text-accent hover:underline">{a.order_code ?? `#${a.order}`}</Link>
          },
          { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
          { key: 'updated', header: 'Approved', render: (a) => <span className="text-xs text-muted">{a.approved_at ? `${a.approved_by_name ?? ''} · ${formatDateTime(a.approved_at)}` : '—'}</span> },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (a) =>
            <div className="flex items-center justify-end gap-2">
                  {a.file && <a href={fileUrl(a.file)} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">File</a>}
                  <ArtworkActions artwork={a} onChanged={reload} />
                </div>

          }]
          } />
        
      </Panel>
      <ArtworkUploadModal open={uploading} onClose={() => setUploading(false)} onDone={() => {setUploading(false);reload();}} />
    </div>);

}