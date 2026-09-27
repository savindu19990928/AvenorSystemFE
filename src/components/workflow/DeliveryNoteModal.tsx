import React from 'react';
import { PrinterIcon } from 'lucide-react';
import type { DeliveryNote } from '../../types/api';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { formatDateTime, formatNumber } from '../../utils/format';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StateMessage } from '../ui/StateMessage';
import { BrandTag } from '../ui/BrandTag';

export function DeliveryNoteModal({ deliveryId, onClose }: {deliveryId: number | null;onClose: () => void;}) {
  const { data, loading, error, reload } = useApi(
    () => deliveryId ? api.get<DeliveryNote>(`/api/delivery/deliveries/${deliveryId}/delivery-note/`) : Promise.resolve(null),
    [deliveryId]
  );

  return (
    <Modal open={deliveryId !== null} onClose={onClose} size="lg" title="Delivery note" footer={<Button icon={PrinterIcon} onClick={() => window.print()}>Print</Button>}>
      {loading && !data ?
      <StateMessage kind="loading" /> :
      error ?
      <StateMessage kind="error" message={error} onRetry={reload} /> :
      data ?
      <article className="space-y-5 text-sm">
          <div className="flex items-start justify-between border-b border-line pb-4">
            <div>
              <p className="text-xs font-semibold text-muted">{data.document_title}</p>
              <p className="mt-1 font-mono text-lg font-semibold">{data.delivery_number}</p>
              <p className="text-xs text-muted">Order <span className="font-mono">{data.order_id}</span> · issued {formatDateTime(data.issued_at)}</p>
            </div>
            <div className="text-right">
              <BrandTag name={data.brand.name} />
              <p className="mt-1 text-xs text-muted">{data.brand.company}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">Deliver to</p>
              <p className="font-medium">{data.customer.company_name}</p>
              <p>{data.customer.contact_person} · {data.customer.phone}</p>
              <p className="text-muted">{data.customer.delivery_address}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Dispatch</p>
              <p>{data.dispatch_details.courier_name || '—'}</p>
              <p className="font-mono text-xs">{data.dispatch_details.tracking_number}</p>
              <p className="text-muted">{formatDateTime(data.dispatch_details.dispatched_date)}</p>
            </div>
          </div>
          <table className="w-full">
            <thead className="border-b border-line text-left text-xs text-faint">
              <tr><th className="py-2 font-medium">Item</th><th className="py-2 font-medium">Spec</th><th className="py-2 text-right font-medium">Qty</th></tr>
            </thead>
            <tbody>
              {data.items.map((i, idx) =>
            <tr key={idx} className="border-b border-line/70">
                  <td className="py-2">{i.product_name}</td>
                  <td className="py-2 text-muted">{[i.colour, i.size, i.fabric_gsm, i.printing_method].filter(Boolean).join(' · ')}</td>
                  <td className="py-2 text-right tabular-nums">{formatNumber(i.quantity)}</td>
                </tr>
            )}
            </tbody>
            <tfoot>
              <tr><td colSpan={2} className="py-2 font-medium">Total pieces</td><td className="py-2 text-right font-semibold tabular-nums">{formatNumber(data.total_packages_or_pieces)}</td></tr>
            </tfoot>
          </table>
          {data.special_instructions && <p className="rounded-lg bg-canvas px-3 py-2 text-muted">{data.special_instructions}</p>}
          <div className="grid grid-cols-2 gap-8 pt-6 text-xs text-muted">
            <div className="border-t border-line-strong pt-2">Dispatched by</div>
            <div className="border-t border-line-strong pt-2">Received by</div>
          </div>
        </article> :
      null}
    </Modal>);

}