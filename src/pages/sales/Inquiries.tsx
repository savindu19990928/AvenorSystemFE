import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, UserPlusIcon, FileTextIcon } from 'lucide-react';
import { useBrands } from '../../contexts/BrandContext';
import { useApi } from '../../hooks/useApi';
import { useAction } from '../../hooks/useAction';
import { api } from '../../utils/api';
import type { Customer, Inquiry } from '../../types/api';
import { formatNumber, humanize, timeAgo } from '../../utils/format';
import { INQUIRY_STATUSES } from '../../data/workflow';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BrandTag } from '../../components/ui/BrandTag';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { InquiryFormModal } from '../../components/inquiries/InquiryFormModal';

export function Inquiries() {
  const navigate = useNavigate();
  const { scope } = useBrands();
  const [status, setStatus] = useState('NEW');
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const { data, loading, error, reload } = useApi(
    () => api.list<Inquiry>('/api/customers/inquiries/', { status, brand: scope }),
    [status, scope]
  );
  const { run, pending } = useAction();

  const convert = async (inq: Inquiry) => {
    const customer = await run(
      () => api.post<Customer>(`/api/customers/inquiries/${inq.id}/convert-to-customer/`),
      'Customer profile created from inquiry'
    );
    if (customer) {
      setSelected({ ...inq, customer: customer.id, status: 'CONVERTED' });
      reload();
    }
  };

  const startQuotation = (inq: Inquiry) => {
    const params = new URLSearchParams({
      new: '1',
      brand: String(inq.brand),
      customer: String(inq.customer ?? ''),
      inquiry: String(inq.id),
      qty: String(inq.quantity ?? ''),
      gsm: inq.fabric_gsm ?? '',
      print: inq.printing_method ?? '',
      notes: inq.requirements ?? ''
    });
    navigate(`/quotations?${params.toString()}`);
  };

  return (
    <div>
      <PageHeader
        title="Leads & inquiries"
        description="Quote requests from the website and walk-ins. Convert a lead to a customer, then quote it."
        actions={<Button variant="primary" icon={PlusIcon} onClick={() => setCreating(true)}>Log inquiry</Button>} />
      
      <Panel flush>
        <div className="px-4 pt-1">
          <Tabs tabs={[...INQUIRY_STATUSES.map((s) => ({ id: s, label: humanize(s) })), { id: '', label: 'All' }]} active={status} onChange={setStatus} />
        </div>
        <DataTable
          rows={data}
          loading={loading}
          error={error}
          onRetry={reload}
          getRowKey={(i) => i.id}
          onRowClick={setSelected}
          emptyTitle={status === 'NEW' ? 'No new inquiries' : 'No inquiries'}
          emptyMessage="Website quote requests will appear here as soon as they're submitted."
          columns={[
          {
            key: 'lead',
            header: 'Lead',
            render: (i) =>
            <div>
                  <p className="font-medium">{i.company_name || i.name}</p>
                  <p className="text-xs text-muted">{i.name} · {i.phone}</p>
                </div>

          },
          { key: 'brand', header: 'Brand', render: (i) => <BrandTag name={i.brand_name} /> },
          { key: 'req', header: 'Request', render: (i) => <span className="text-muted">{formatNumber(i.quantity)} × {i.product_name || 'unspecified'}</span> },
          { key: 'source', header: 'Source', render: (i) => <span className="text-muted">{humanize(i.source)}</span> },
          { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
          { key: 'when', header: 'Received', render: (i) => <span className="whitespace-nowrap text-muted">{timeAgo(i.created_at)}</span> }]
          } />
        
      </Panel>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? selected.company_name || selected.name : ''}
        description={selected ? `Inquiry #${selected.id} · ${humanize(selected.source)}` : undefined}
        footer={
        selected &&
        <>
              {!selected.customer &&
          <Button icon={UserPlusIcon} loading={pending} onClick={() => convert(selected)}>
                  Convert to customer
                </Button>
          }
              <Button variant="primary" icon={FileTextIcon} disabled={!selected.customer} onClick={() => startQuotation(selected)}>
                Create quotation
              </Button>
            </>

        }>
        
        {selected &&
        <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <BrandTag name={selected.brand_name} />
              <StatusBadge status={selected.status} />
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div><dt className="text-xs text-muted">Contact</dt><dd>{selected.name}</dd></div>
              <div><dt className="text-xs text-muted">Phone / WhatsApp</dt><dd>{selected.phone}{selected.whatsapp && selected.whatsapp !== selected.phone ? ` · ${selected.whatsapp}` : ''}</dd></div>
              <div><dt className="text-xs text-muted">Email</dt><dd className="break-all">{selected.email || '—'}</dd></div>
              <div><dt className="text-xs text-muted">Product</dt><dd>{selected.product_name || '—'}</dd></div>
              <div><dt className="text-xs text-muted">Quantity</dt><dd>{formatNumber(selected.quantity)}</dd></div>
              <div><dt className="text-xs text-muted">Fabric / printing</dt><dd>{[selected.fabric_gsm, selected.printing_method].filter(Boolean).join(' · ') || '—'}</dd></div>
            </dl>
            {selected.requirements && <p className="rounded-lg bg-canvas px-3 py-2.5 text-muted">{selected.requirements}</p>}
            {!selected.customer && <p className="text-xs text-faint">Convert this lead to a customer before quoting — the details are copied across automatically.</p>}
          </div>
        }
      </Modal>

      <InquiryFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          reload();
        }} />
      
    </div>);

}