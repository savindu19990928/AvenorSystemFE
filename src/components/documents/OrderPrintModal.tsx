import React from 'react';
import type { OrderDetail } from '../../types/api';
import { useBrandIdentity } from '../../hooks/useBrandIdentity';
import { DocumentViewer } from '../print/DocumentViewer';
import { OrderDocument } from './OrderDocument';

export function OrderPrintModal({ order, onClose }: {order: OrderDetail | null;onClose: () => void;}) {
  const brand = useBrandIdentity(order?.brand, order?.brand_name);
  return (
    <DocumentViewer open={order !== null} onClose={onClose} title={order ? `Order ${order.order_id}` : 'Order'} filename={`order-${order?.order_id ?? ''}`}>
      {order && <OrderDocument order={order} brand={brand} />}
    </DocumentViewer>);

}