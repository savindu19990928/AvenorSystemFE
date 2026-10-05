import React from 'react';
import type { OrderDetail, Payment } from '../../types/api';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { useBrandIdentity } from '../../hooks/useBrandIdentity';
import { DocumentViewer } from '../print/DocumentViewer';
import { ReceiptDocument } from './ReceiptDocument';

interface ReceiptPrintModalProps {
  payment: Payment | null;
  /** Pass when the order is already loaded to skip a fetch. */
  order?: OrderDetail | null;
  onClose: () => void;
}

export function ReceiptPrintModal({ payment, order, onClose }: ReceiptPrintModalProps) {
  const fetched = useApi(
    () => payment?.order && !order ? api.get<OrderDetail>(`/api/orders/orders/${payment.order}/`).catch(() => null) : Promise.resolve(null),
    [payment, order]
  );
  const resolvedOrder = order ?? fetched.data;
  const brand = useBrandIdentity(resolvedOrder?.brand, resolvedOrder?.brand_name);

  return (
    <DocumentViewer
      open={payment !== null}
      onClose={onClose}
      title={payment ? `Receipt ${payment.payment_id}` : 'Receipt'}
      filename={`receipt-${payment?.payment_id ?? ''}`}
      loading={fetched.loading && !order}>
      
      {payment && <ReceiptDocument payment={payment} order={resolvedOrder} brand={brand} />}
    </DocumentViewer>);

}