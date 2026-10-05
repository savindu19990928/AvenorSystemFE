import React from 'react';
import type { Invoice, InvoiceDetail, OrderDetail } from '../../types/api';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { useBrandIdentity } from '../../hooks/useBrandIdentity';
import { DocumentViewer } from '../print/DocumentViewer';
import { InvoiceDocument } from './InvoiceDocument';

async function loadInvoice(invoice: Invoice): Promise<{invoice: InvoiceDetail;order: OrderDetail | null;}> {
  const [detail, order] = await Promise.all([
  invoice.id ? api.get<InvoiceDetail>(`/api/billing/invoices/${invoice.id}/`).catch(() => invoice as InvoiceDetail) : Promise.resolve(invoice as InvoiceDetail),
  invoice.order ? api.get<OrderDetail>(`/api/orders/orders/${invoice.order}/`).catch(() => null) : Promise.resolve(null)]
  );
  return { invoice: { ...invoice, ...detail }, order };
}

export function InvoicePrintModal({ invoice, onClose }: {invoice: Invoice | null;onClose: () => void;}) {
  const { data, loading, error, reload } = useApi(() => invoice ? loadInvoice(invoice) : Promise.resolve(null), [invoice]);
  const brand = useBrandIdentity(data?.invoice.brand ?? data?.order?.brand, data?.invoice.brand_name ?? data?.order?.brand_name);

  return (
    <DocumentViewer
      open={invoice !== null}
      onClose={onClose}
      title={invoice ? `Invoice ${invoice.invoice_number}` : 'Invoice'}
      filename={`invoice-${invoice?.invoice_number ?? ''}`}
      loading={loading && !data}
      error={error}
      onRetry={reload}>
      
      {data && <InvoiceDocument invoice={data.invoice} order={data.order} brand={brand} />}
    </DocumentViewer>);

}