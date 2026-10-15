import React from 'react';
import type { Bill, OrderDetail } from '../../types/api';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { useBrandIdentity } from '../../hooks/useBrandIdentity';
import { DocumentViewer } from '../print/DocumentViewer';
import { BillDocument } from './BillDocument';

async function loadBill(bill: Bill): Promise<{ bill: Bill; order: OrderDetail | null }> {
  const order = bill.order
    ? await api.get<OrderDetail>(`/api/orders/orders/${bill.order}/`).catch(() => null)
    : null;
  return { bill, order };
}

export function BillPrintModal({ bill, onClose }: { bill: Bill | null; onClose: () => void }) {
  const { data, loading, error, reload } = useApi(
    () => (bill ? loadBill(bill) : Promise.resolve(null)),
    [bill]
  );
  const brand = useBrandIdentity(
    data?.order?.brand,
    data?.bill.brand_name ?? data?.order?.brand_name
  );

  return (
    <DocumentViewer
      open={bill !== null}
      onClose={onClose}
      title={bill ? `Bill ${bill.bill_number}` : 'Bill'}
      filename={`bill-${bill?.bill_number ?? ''}`}
      loading={loading && !data}
      error={error}
      onRetry={reload}
    >
      {data && <BillDocument bill={data.bill} order={data.order} brand={brand} />}
    </DocumentViewer>
  );
}
