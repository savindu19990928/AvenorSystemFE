import React from 'react';
import type { Order } from '../../types/api';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { inputClass } from '../../utils/styles';

interface OrderSelectProps {
  id?: string;
  value: number | null;
  onChange: (order: Order | null) => void;
  status?: string;
}

export function OrderSelect({ id, value, onChange, status }: OrderSelectProps) {
  const { data, loading, error } = useApi(() => api.list<Order>('/api/orders/orders/', { status }), [status]);
  const open = data?.filter((o) => o.status !== 'CANCELLED' && o.status !== 'ORDER_CLOSED');
  return (
    <select
      id={id}
      className={inputClass}
      value={value ?? ''}
      disabled={loading}
      onChange={(e) => onChange(data?.find((o) => o.id === Number(e.target.value)) ?? null)}>
      
      <option value="">{loading ? 'Loading orders…' : error ? 'Could not load orders' : 'Select an order'}</option>
      {open?.map((o) =>
      <option key={o.id} value={o.id}>
          {o.order_id} · {o.customer_company || o.customer_name} · {o.brand_name}
        </option>
      )}
    </select>);

}