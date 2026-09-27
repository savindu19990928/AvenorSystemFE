import React, { useState } from 'react';
import { LockIcon, UploadIcon } from 'lucide-react';
import type { Artwork, OrderDetail } from '../../types/api';
import { api, fileUrl } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/format';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { StateMessage } from '../ui/StateMessage';
import { ArtworkActions } from '../artwork/ArtworkActions';
import { ArtworkUploadModal } from '../workflow/ArtworkUploadModal';

export function OrderArtworkTab({ order, onChanged }: {order: OrderDetail;onChanged: () => void;}) {
  const { hasRole } = useAuth();
  const [uploading, setUploading] = useState(false);
  const list = useApi(
    () => api.list<Artwork>('/api/artworks/artworks/', { order: order.id }).then((l) => l.filter((a) => a.order === order.id || a.order_code === order.order_id)),
    [order.id]
  );
  const artworks: Artwork[] = list.data && list.data.length ? list.data : (order.artworks ?? []).map((a) => ({ ...a, order: order.id }));

  const refresh = () => {
    list.reload();
    onChanged();
  };

  return (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Draft → Sent to customer → Revision → Approved. Approved artwork is locked for production.</p>
        {hasRole('ADMIN', 'SALES') && <Button size="sm" icon={UploadIcon} onClick={() => setUploading(true)}>Upload</Button>}
      </div>
      {list.loading && !list.data ?
      <StateMessage kind="loading" /> :
      artworks.length === 0 ?
      <StateMessage kind="empty" title="No artwork yet" message="Upload the customer's design to start the approval cycle." /> :

      <ul className="divide-y divide-line rounded-lg border border-line">
          {artworks.map((a) =>
        <li key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-ink">{a.title}</p>
                  <span className="text-xs text-muted">v{a.version}</span>
                  <StatusBadge status={a.status} />
                  {a.is_locked && <span className="inline-flex items-center gap-1 text-xs text-ok"><LockIcon className="h-3 w-3" />Locked</span>}
                </div>
                <p className="mt-1 text-xs text-muted">
                  {[a.placement, a.dimensions, a.color_codes].filter(Boolean).join(' · ') || 'No specification recorded'}
                </p>
                {a.approved_at && <p className="mt-0.5 text-xs text-faint">Approved by {a.approved_by_name} · {formatDateTime(a.approved_at)}</p>}
                {a.rejection_notes && <p className="mt-1 text-xs text-warn">Revision: {a.rejection_notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                {a.file && <a href={fileUrl(a.file)} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">Open file</a>}
                <ArtworkActions artwork={a} onChanged={refresh} />
              </div>
            </li>
        )}
        </ul>
      }
      <ArtworkUploadModal open={uploading} order={order} onClose={() => setUploading(false)} onDone={() => {setUploading(false);refresh();}} />
    </div>);

}