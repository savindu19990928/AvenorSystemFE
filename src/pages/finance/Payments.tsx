import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletIcon } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { api } from '../../utils/api';
import type { Payment } from '../../types/api';
import { formatDate, formatMoney, humanize, toNumber } from '../../utils/format';
import { PAYMENT_METHODS } from '../../data/workflow';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Tabs } from '../../components/ui/Tabs';
import { PaymentFormModal } from '../../components/workflow/PaymentFormModal';
import { ReceiptPrintModal } from '../../components/documents/ReceiptPrintModal';
import { RowPrintButton } from '../../components/print/RowPrintButton';
import { ReportExportActions } from '../../components/print/ReportExportActions';
import { paymentsReport } from '../../utils/reports';
import { inputClass } from '../../utils/styles';

export function PaymentsPage() {
  const navigate = useNavigate();
  const [type, setType] = useState('');
  const [method, setMethod] = useState('');
  const [recording, setRecording] = useState(false);
  const { data, loading, error, reload } = useApi(() => api.list<Payment>('/api/billing/payments/', { payment_type: type, payment_method: method }), [type, method]);
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const total = (data ?? []).reduce((s, p) => s + toNumber(p.amount), 0);
  const spec = useMemo(() => {
    if (!data) return null;
    const typeLabel = type === 'DEPOSIT' ? 'Deposits' : type === 'BALANCE' ? 'Balance payments' : 'All payment types';
    const methodLabel = PAYMENT_METHODS.find((m) => m.value === method)?.label ?? 'all methods';
    return paymentsReport(data, `${typeLabel} · ${methodLabel}`);
  }, [data, type, method]);

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Deposits and balance payments, each with a unique Payment ID linked to the customer, order and invoice."
        actions={
        <>
            <ReportExportActions spec={spec} />
            <Button variant="primary" icon={WalletIcon} onClick={() => setRecording(true)}>Record payment</Button>
          </>
        }>
        
        {data && <p className="mt-3 text-sm text-muted">Total in this view: <span className="font-semibold text-ink tabular-nums">{formatMoney(total)}</span></p>}
      </PageHeader>
      <Panel flush>
        <div className="flex flex-col gap-3 px-4 pt-1 sm:flex-row sm:items-end sm:justify-between">
          <Tabs tabs={[{ id: '', label: 'All' }, { id: 'DEPOSIT', label: 'Deposits' }, { id: 'BALANCE', label: 'Balance payments' }]} active={type} onChange={setType} />
          <select aria-label="Payment method" className={`${inputClass} mb-2 sm:w-44`} value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="">All methods</option>
            {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <DataTable
          rows={data}
          loading={loading}
          error={error}
          onRetry={reload}
          getRowKey={(p) => p.payment_id}
          onRowClick={(p) => p.order && navigate(`/orders/${p.order}`)}
          emptyTitle="No payments"
          columns={[
          { key: 'id', header: 'Payment ID', render: (p) => <span className="font-mono text-xs font-medium">{p.payment_id}</span> },
          { key: 'date', header: 'Date', render: (p) => <span className="whitespace-nowrap">{formatDate(p.payment_date)}</span> },
          { key: 'cust', header: 'Customer', render: (p) => p.customer_name ?? '—' },
          { key: 'order', header: 'Order', render: (p) => <span className="font-mono text-xs">{p.order_code ?? '—'}</span> },
          { key: 'type', header: 'Type', render: (p) => p.payment_type_display ?? humanize(p.payment_type) },
          { key: 'method', header: 'Method', render: (p) => <span className="text-muted">{p.payment_method_display ?? humanize(p.payment_method)}{p.reference_number ? ` · ${p.reference_number}` : ''}</span> },
          { key: 'by', header: 'Recorded by', render: (p) => <span className="text-muted">{p.recorded_by_name ?? '—'}</span> },
          { key: 'amt', header: 'Amount', align: 'right', render: (p) => <span className="font-medium">{formatMoney(p.amount)}</span> },
          { key: 'print', header: '', align: 'right', render: (p) => <RowPrintButton label={`Print receipt ${p.payment_id}`} onClick={() => setReceipt(p)} /> }]
          } />
        
      </Panel>
      <ReceiptPrintModal payment={receipt} onClose={() => setReceipt(null)} />
      <PaymentFormModal open={recording} onClose={() => setRecording(false)} onDone={() => {setRecording(false);reload();}} />
    </div>);

}