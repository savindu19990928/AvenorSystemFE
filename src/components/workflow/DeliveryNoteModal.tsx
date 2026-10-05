import React from 'react';
import type { DeliveryNote } from '../../types/api';
import type { BrandIdentity } from '../../types/print';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { useBrandIdentity } from '../../hooks/useBrandIdentity';
import { DocumentViewer } from '../print/DocumentViewer';
import { DeliveryNoteDocument } from '../documents/DeliveryNoteDocument';

export function DeliveryNoteModal({ deliveryId, onClose }: {deliveryId: number | null;onClose: () => void;}) {
  const { data, loading, error, reload } = useApi(
    () => deliveryId ? api.get<DeliveryNote>(`/api/delivery/deliveries/${deliveryId}/delivery-note/`) : Promise.resolve(null),
    [deliveryId]
  );
  const known = useBrandIdentity(null, data?.brand.name);
  const brand: BrandIdentity = data ?
  { ...known, name: data.brand.name, company: data.brand.company || known.company, positioning: data.brand.positioning || known.positioning } :
  known;

  return (
    <DocumentViewer
      open={deliveryId !== null}
      onClose={onClose}
      title={data ? `Delivery note ${data.delivery_number}` : 'Delivery note'}
      filename={`delivery-note-${data?.delivery_number ?? deliveryId}`}
      loading={loading && !data}
      error={error}
      onRetry={reload}>
      
      {data && <DeliveryNoteDocument note={data} brand={brand} />}
    </DocumentViewer>);

}