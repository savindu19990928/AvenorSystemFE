import React from 'react';
import type { Quotation } from '../../types/api';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { useBrandIdentity } from '../../hooks/useBrandIdentity';
import { DocumentViewer } from '../print/DocumentViewer';
import { QuotationDocument } from './QuotationDocument';

export function QuotationPrintModal({ quotationId, onClose }: {quotationId: number | null;onClose: () => void;}) {
  const { data, loading, error, reload } = useApi(
    () => quotationId ? api.get<Quotation>(`/api/quotations/quotations/${quotationId}/`) : Promise.resolve(null),
    [quotationId]
  );
  const brand = useBrandIdentity(data?.brand, data?.brand_name);

  return (
    <DocumentViewer
      open={quotationId !== null}
      onClose={onClose}
      title={data ? `Quotation ${data.quotation_number}` : 'Quotation'}
      filename={`quotation-${data?.quotation_number ?? quotationId}`}
      loading={loading && !data}
      error={error}
      onRetry={reload}>
      
      {data && <QuotationDocument quotation={data} brand={brand} />}
    </DocumentViewer>);

}