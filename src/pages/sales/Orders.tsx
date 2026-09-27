import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBrands } from '../../contexts/BrandContext';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { api } from '../../utils/api';
import type { Order } from '../../types/api';
import { formatDate, formatMoney, humanize, toNumber } from '../../utils/format';
import { ORDER_PIPELINE } from '../../data/workflow';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BrandTag } from '../../components/ui/BrandTag';
import { SearchInput } from '../../components/ui/SearchInput';
import { OrderFormModal } from '../../components/orders/OrderFormModal';
import { inputClass } from '../../utils/styles';

export function Orders() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { scope } = useBrands();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [status, setStatus] = useState(params.get('status') ?? '');
  const [creating, setCreating] = useState(false);
  const q = useDebounce(search);

  useEffect(() => {
    setSearch(params.get('search') ?? '');
    setStatus(params.get('status') ?? '');
  }, [params]);

  const { data, loading, error, reload } = useApi(
    () => api.list<Order>('/api/orders/orders/', { brand: scope, status, search: q }),
    [scope, status, q]
  );

  useEffect(() => {
    if (q && data && data.length === 1 && data[0].order_id.toLowerCase() === q.toLowerCase()) navigate(`/orders/${data[0].id}`, { replace: true });
  }, [data, q, navigate]);

  const changeStatus = (value: string) => {
    setStatus(value);
    const next = new URLSearchParams(params);
    if (value) next.set('status', value);else
    next.delete('status');
    setParams(next, { replace: true });
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        description="The central record. Artwork, stock, production, delivery, invoices, payments and profit all link to the Order ID."
        actions={hasRole('ADMIN', 'SALES') && <Button variant="primary" icon={PlusIcon} onClick={() => setCreating(true)}>New order</Button>} />
      
      <Panel flush>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search order ID, customer, company or address" className="flex-1" />
          <select aria-label="Status" className={`${inputClass} sm:w-56`} value={status} onChange={(e) => changeStatus(e.target.value)}>
            <option value="">All statuses</option>
            {[...ORDER_PIPELINE, 'CANCELLED'].map((s) =>
            <option key={s} value={s}>{humanize(s)}</option>
            )}
          </select>
        </div>
        <DataTable
          rows={data}
          loading={loading}
          error={error}
          onRetry={reload}
          getRowKey={(o) => o.id}
          onRowClick={(o) => navigate(`/orders/${o.id}`)}
          emptyTitle={q || status ? 'No orders match' : 'No orders yet'}
          emptyMessage={q || status ? 'Try a different search or status.' : 'Orders are created from approved quotations or directly.'}
          columns={[
          { key: 'id', header: 'Order ID', render: (o) => <span className="font-mono text-xs font-medium">{o.order_id}</span> },
          {
            key: 'customer',
            header: 'Customer',
            render: (o) =>
            <div>
                  <p className="font-medium">{o.customer_company || o.customer_name}</p>
                  <p className="text-xs text-muted">{o.customer_name}</p>
                </div>

          },
          { key: 'brand', header: 'Brand', render: (o) => <BrandTag name={o.brand_name} /> },
          { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
          { key: 'due', header: 'Delivery due', render: (o) => <span className="whitespace-nowrap">{formatDate(o.expected_delivery_date)}</span> },
          { key: 'total', header: 'Total', align: 'right', render: (o) => formatMoney(o.total_amount) },
          {
            key: 'bal',
            header: 'Balance',
            align: 'right',
            render: (o) => <span className={toNumber(o.balance_amount) > 0 ? 'text-ink' : 'text-muted'}>{formatMoney(o.balance_amount)}</span>
          }]
          } />
        
      </Panel>
      <OrderFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(o) => {
          setCreating(false);
          navigate(`/orders/${o.id}`);
        }} />
      
    </div>);

}