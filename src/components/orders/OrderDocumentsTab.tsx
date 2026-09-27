import React, { useState } from 'react';
import { FileIcon, PaperclipIcon } from 'lucide-react';
import type { OrderDetail } from '../../types/api';
import { fileUrl } from '../../utils/api';
import { DOCUMENT_TYPES } from '../../data/workflow';
import { formatDateTime, humanize } from '../../utils/format';
import { Button } from '../ui/Button';
import { DocumentUploadModal } from '../workflow/DocumentUploadModal';

export function OrderDocumentsTab({ order, onChanged }: {order: OrderDetail;onChanged: () => void;}) {
  const [uploading, setUploading] = useState(false);
  const docs = order.documents ?? [];

  return (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">Quotation, artwork, PO, invoice, receipts and delivery note — all filed under this Order ID.</p>
        <Button size="sm" icon={PaperclipIcon} onClick={() => setUploading(true)}>Attach</Button>
      </div>
      <ul className="grid gap-x-8 sm:grid-cols-2">
        {DOCUMENT_TYPES.map((t) => {
          const matches = docs.filter((d) => d.document_type === t.value);
          return (
            <li key={t.value} className="border-b border-line py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">{t.label}</span>
                <span className={`text-xs ${matches.length ? 'text-ok' : 'text-faint'}`}>{matches.length ? `${matches.length} attached` : 'Missing'}</span>
              </div>
              {matches.map((d) =>
              <a key={d.id} href={fileUrl(d.file)} target="_blank" rel="noreferrer" className="mt-1.5 flex items-center gap-2 text-sm text-accent hover:underline">
                  <FileIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{d.title}</span>
                  <span className="shrink-0 text-xs text-faint">{d.uploaded_by_name} · {formatDateTime(d.created_at)}</span>
                </a>
              )}
            </li>);

        })}
      </ul>
      {docs.some((d) => !DOCUMENT_TYPES.find((t) => t.value === d.document_type)) &&
      <div className="mt-4">
          <p className="text-xs text-muted">Other</p>
          {docs.filter((d) => !DOCUMENT_TYPES.find((t) => t.value === d.document_type)).map((d) =>
        <a key={d.id} href={fileUrl(d.file)} target="_blank" rel="noreferrer" className="mt-1 block text-sm text-accent hover:underline">
              {d.title} ({d.document_type_display ?? humanize(d.document_type)})
            </a>
        )}
        </div>
      }
      <DocumentUploadModal open={uploading} orderId={order.id} orderCode={order.order_id} onClose={() => setUploading(false)} onDone={() => {setUploading(false);onChanged();}} />
    </div>);

}