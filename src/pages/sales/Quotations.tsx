import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBrands } from '../../contexts/BrandContext';
import { useApi } from '../../hooks/useApi';
import { api } from '../../utils/api';
import type { Quotation } from '../../types/api';
import { formatDate, formatMoney, humanize } from '../../utils/format';
import { QUOTATION_STATUSES } from '../../data/workflow';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BrandTag } from '../../components/ui/BrandTag';
import { Tabs } from '../../components/ui/Tabs';
import { QuotationFormModal } from '../../components/quotations/QuotationFormModal';
import type { QuotationPrefill } from '../../components/quotations/QuotationFormModal';
import { QuotationDetailModal } from '../../components/quotations/QuotationDetailModal';

export function Quotations() {
  const { hasRole } = useAuth();
  const { scope } = useBrands();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const { data, loading, error, reload } = useApi(
    () => api.list<Quotation>('/api/quotations/quotations/', { brand: scope, status }),
    [scope, status]
  );

  const prefill = useMemo<QuotationPrefill | null>(() => {
    if (params.get('new') !== '1') return null;
    const num = (k: string) => params.get(k) ? Number(params.get(k)) : undefined;
    return {
      brand: num('brand'),
      customer: num('customer'),
      inquiry: num('inquiry'),
      quantity: params.get('qty') ?? undefined,
      fabric_gsm: params.get('gsm') ?? undefined,
      printing_method: params.get('print') ?? undefined,
      notes: params.get('notes') ?? undefined
    };
  }, [params]);

  useEffect(() => {
    if (prefill) setCreating(true);
  }, [prefill]);

  const closeForm = () => {
    setCreating(false);
    if (params.get('new')) setParams({}, { replace: true });
  };

  return (
    <div>
      <PageHeader
        title="Quotations"
        description="Price proposals per brand. Approved quotations convert to orders without re-entering any details."
        actions={hasRole('ADMIN', 'SALES') && <Button variant="primary" icon={PlusIcon} onClick={() => setCreating(true)}>New quotation</Button>} />
      
      <Panel flush>
        <div className="px-4 pt-1">
          <Tabs tabs={[{ id: '', label: 'All' }, ...QUOTATION_STATUSES.map((s) => ({ id: s, label: humanize(s) }))]} active={status} onChange={setStatus} />
        </div>
        <DataTable
          rows={data}
          loading={loading}
          error={error}
          onRetry={reload}
          getRowKey={(q) => q.id}
          onRowClick={(q) => setOpenId(q.id)}
          emptyTitle="No quotations"
          emptyMessage="Create a quotation from a customer or a converted inquiry."
          columns={[
          { key: 'no', header: 'Quotation', render: (q) => <span className="font-mono text-xs font-medium">{q.quotation_number}</span> },
          {
            key: 'customer',
            header: 'Customer',
            render: (q) =>
            <div>
                  <p className="font-medium">{q.customer_company || q.customer_name}</p>
                  <p className="text-xs text-muted">{q.customer_name}</p>
                </div>

          },
          { key: 'brand', header: 'Brand', render: (q) => <BrandTag name={q.brand_name} /> },
          { key: 'status', header: 'Status', render: (q) => <StatusBadge status={q.status} /> },
          { key: 'valid', header: 'Valid until', render: (q) => formatDate(q.validity_date) },
          { key: 'total', header: 'Total', align: 'right', render: (q) => <span className="font-medium">{formatMoney(q.total_amount)}</span> }]
          } />
        
      </Panel>
      <QuotationFormModal
        open={creating}
        prefill={prefill}
        onClose={closeForm}
        onCreated={(q) => {
          closeForm();
          reload();
          setOpenId(q.id);
        }} />
      
      <QuotationDetailModal quotationId={openId} onClose={() => setOpenId(null)} onChanged={reload} />
    </div>);

}