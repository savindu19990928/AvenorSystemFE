import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceiptIcon } from 'lucide-react';
import { useBrands } from '../../contexts/BrandContext';
import { useApi } from '../../hooks/useApi';
import { api } from '../../utils/api';
import type { Invoice } from '../../types/api';
import { formatDate, formatMoney, toNumber } from '../../utils/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BrandTag } from '../../components/ui/BrandTag';
import { Tabs } from '../../components/ui/Tabs';
import { GenerateInvoiceModal } from '../../components/workflow/GenerateInvoiceModal';
import { InvoiceExportButtons } from '../../components/documents/InvoiceExportButtons';
import { DocumentRenderStage } from '../../components/documents/DocumentRenderStage';
import { useDocumentExport } from '../../hooks/useDocumentExport';

const FILTERS = [
{ id: '', label: 'All' },
{ id: 'UNPAID', label: 'Unpaid' },
{ id: 'PARTIALLY_PAID', label: 'Partially paid' },
{ id: 'PAID', label: 'Paid' },
{ id: 'OVERDUE', label: 'Overdue' },
{ id: 'CANCELLED', label: 'Cancelled' }];


export function InvoicesPage() {
  const navigate = useNavigate();
  const { scope } = useBrands();
  const [status, setStatus] = useState('');
  const [generating, setGenerating] = useState(false);
  const { exportInvoice, busy, stageProps } = useDocumentExport();
  const { data, loading, error, reload } = useApi(() => api.list<Invoice>('/api/billing/invoices/', { status, brand: scope }), [status, scope]);
  const outstanding = (data ?? []).filter((i) => i.status !== 'CANCELLED').reduce((s, i) => s + toNumber(i.balance_amount), 0);

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Generated from orders — no manual re-entry. Cancelled invoices are kept and marked, never deleted."
        actions={<Button variant="primary" icon={ReceiptIcon} onClick={() => setGenerating(true)}>Generate invoice</Button>}>
        
        {data && <p className="mt-3 text-sm text-muted">Outstanding in this view: <span className="font-semibold text-ink tabular-nums">{formatMoney(outstanding)}</span></p>}
      </PageHeader>
      <Panel flush>
        <div className="px-4 pt-1">
          <Tabs tabs={FILTERS} active={status} onChange={setStatus} />
        </div>
        <DataTable
          rows={data}
          loading={loading}
          error={error}
          onRetry={reload}
          getRowKey={(i) => i.invoice_number}
          onRowClick={(i) => i.order && navigate(`/orders/${i.order}`)}
          rowClassName={(i) => i.status === 'CANCELLED' ? 'opacity-60' : ''}
          emptyTitle="No invoices"
          columns={[
          { key: 'no', header: 'Invoice', render: (i) => <span className="font-mono text-xs font-medium">{i.invoice_number}</span> },
          { key: 'order', header: 'Order', render: (i) => <span className="font-mono text-xs">{i.order_code}</span> },
          { key: 'cust', header: 'Customer', render: (i) => i.customer_company || i.customer_name },
          { key: 'brand', header: 'Brand', render: (i) => <BrandTag name={i.brand_name} /> },
          { key: 'date', header: 'Issued / due', render: (i) => <span className="whitespace-nowrap text-muted">{formatDate(i.invoice_date)} → {formatDate(i.due_date)}</span> },
          { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
          { key: 'total', header: 'Total', align: 'right', render: (i) => formatMoney(i.total_amount) },
          { key: 'bal', header: 'Balance', align: 'right', render: (i) => <span className={toNumber(i.balance_amount) > 0 && i.status !== 'CANCELLED' ? 'font-medium' : 'text-muted'}>{formatMoney(i.balance_amount)}</span> },
          { key: 'pdf', header: '', align: 'right', className: 'w-px py-1.5', render: (i) => <InvoiceExportButtons invoice={i} busy={busy} onExport={exportInvoice} /> }]
          } />
        
      </Panel>
      <GenerateInvoiceModal open={generating} onClose={() => setGenerating(false)} onDone={() => {setGenerating(false);reload();}} />
      <DocumentRenderStage {...stageProps} />
    </div>);

}