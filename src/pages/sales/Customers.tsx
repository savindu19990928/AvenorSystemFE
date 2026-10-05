import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { api } from '../../utils/api';
import type { Customer } from '../../types/api';
import { formatMoney, humanize, toNumber } from '../../utils/format';
import { CUSTOMER_TYPES } from '../../data/workflow';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { SearchInput } from '../../components/ui/SearchInput';
import { CustomerFormModal } from '../../components/customers/CustomerFormModal';
import { inputClass } from '../../utils/styles';

export function Customers() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [creating, setCreating] = useState(false);
  const q = useDebounce(search);
  const { data, loading, error, reload } = useApi(
    () => api.list<Customer>('/api/customers/customers/', { search: q, customer_type: type }),
    [q, type]
  );
  const canEdit = hasRole('ADMIN', 'SALES');

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Company profiles with purchase history, outstanding balances and payment records."
        actions={canEdit && <Button variant="primary" icon={PlusIcon} onClick={() => setCreating(true)}>New customer</Button>} />
      
      <Panel flush>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, contact, phone, email or tax ID" className="flex-1" />
          <select aria-label="Customer type" className={`${inputClass} sm:w-48`} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            {CUSTOMER_TYPES.map((t) =>
            <option key={t.value} value={t.value}>{t.label}</option>
            )}
          </select>
        </div>
        <DataTable
          rows={data}
          loading={loading}
          error={error}
          onRetry={reload}
          getRowKey={(c) => c.id}
          onRowClick={(c) => navigate(`/customers/${c.id}`)}
          emptyTitle={q || type ? 'No customers match' : 'No customers yet'}
          emptyMessage={q || type ? 'Try a different search or filter.' : 'Customers are created here or converted from website inquiries.'}
          columns={[
          {
            key: 'name',
            header: 'Customer',
            render: (c) =>
            <div>
                  <p className="font-medium">{c.company_name || c.contact_person}</p>
                  <p className="text-xs text-muted">{[c.company_name ? c.contact_person : '', c.phone].filter(Boolean).join(' · ') || '—'}</p>
                </div>

          },
          { key: 'type', header: 'Type', render: (c) => <span className="text-muted">{humanize(c.customer_type)}</span> },
          { key: 'orders', header: 'Orders', align: 'right', render: (c) => c.total_orders_count },
          { key: 'purchases', header: 'Total purchases', align: 'right', render: (c) => formatMoney(c.total_purchases) },
          {
            key: 'outstanding',
            header: 'Outstanding',
            align: 'right',
            render: (c) =>
            <span className={toNumber(c.outstanding_balance) > 0 ? 'font-medium text-danger' : 'text-muted'}>{formatMoney(c.outstanding_balance)}</span>

          }]
          } />
        
      </Panel>
      <CustomerFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(c) => {
          setCreating(false);
          navigate(`/customers/${c.id}`);
        }} />
      
    </div>);

}