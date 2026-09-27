import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, MailIcon, PencilIcon, PhoneIcon, MessageCircleIcon, Trash2Icon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { useAction } from '../../hooks/useAction';
import { api, apiRequest, fileUrl } from '../../utils/api';
import type { CustomerDetail, Order, Payment } from '../../types/api';
import { formatDate, formatDateTime, formatMoney, humanize, toNumber } from '../../utils/format';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BrandTag } from '../../components/ui/BrandTag';
import { StateMessage } from '../../components/ui/StateMessage';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CustomerFormModal } from '../../components/customers/CustomerFormModal';
import { inputClass } from '../../utils/styles';

type Tab = 'orders' | 'payments' | 'notes' | 'documents';

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canEdit = hasRole('ADMIN', 'SALES');
  const [tab, setTab] = useState<Tab>('orders');
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [note, setNote] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const customer = useApi(() => api.get<CustomerDetail>(`/api/customers/customers/${id}/`), [id]);
  const orders = useApi(() => api.list<Order>(`/api/customers/customers/${id}/orders/`), [id]);
  const payments = useApi(() => api.list<Payment>(`/api/customers/customers/${id}/payments/`), [id]);
  const { run, pending } = useAction();

  if (customer.loading && !customer.data) return <StateMessage kind="loading" />;
  if (customer.error || !customer.data) return <StateMessage kind="error" message={customer.error ?? 'Customer not found'} onRetry={customer.reload} />;
  const c = customer.data;

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    const res = await run(() => api.post(`/api/customers/customers/${id}/add-note/`, { note: note.trim() }), 'Note added');
    if (res !== undefined) {
      setNote('');
      customer.reload();
    }
  };

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) return;
    const fd = new FormData();
    fd.append('title', docTitle || docFile.name);
    fd.append('file', docFile);
    const res = await run(() => apiRequest(`/api/customers/customers/${id}/upload-document/`, { method: 'POST', body: fd }), 'Document uploaded');
    if (res !== undefined) {
      setDocTitle('');
      setDocFile(null);
      customer.reload();
    }
  };

  const remove = async () => {
    const res = await run(() => api.del(`/api/customers/customers/${id}/`), 'Customer archived');
    if (res !== undefined) navigate('/customers');
  };

  return (
    <div className="space-y-6">
      <Link to="/customers" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeftIcon className="h-4 w-4" /> Customers
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs text-muted">{humanize(c.customer_type)} customer</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">{c.company_name}</h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
            <span>{c.contact_person}</span>
            <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 hover:text-ink"><PhoneIcon className="h-3.5 w-3.5" />{c.phone}</a>
            {c.whatsapp && <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-ink"><MessageCircleIcon className="h-3.5 w-3.5" />WhatsApp</a>}
            {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 hover:text-ink"><MailIcon className="h-3.5 w-3.5" />{c.email}</a>}
          </div>
        </div>
        {canEdit &&
        <div className="flex gap-2">
            <Button icon={PencilIcon} onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="ghost" icon={Trash2Icon} onClick={() => setDeleting(true)}>Archive</Button>
          </div>
        }
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="order-2 lg:order-1">
          <Panel flush>
            <div className="px-4 pt-1">
              <Tabs<Tab>
                tabs={[
                { id: 'orders', label: 'Orders', count: orders.data?.length },
                { id: 'payments', label: 'Payments', count: payments.data?.length },
                { id: 'notes', label: 'Notes', count: c.notes?.length ?? 0 },
                { id: 'documents', label: 'Documents', count: c.documents?.length ?? 0 }]
                }
                active={tab}
                onChange={setTab} />
              
            </div>
            {tab === 'orders' &&
            <DataTable
              rows={orders.data}
              loading={orders.loading}
              error={orders.error}
              onRetry={orders.reload}
              getRowKey={(o) => o.id}
              onRowClick={(o) => navigate(`/orders/${o.id}`)}
              emptyTitle="No orders yet"
              columns={[
              { key: 'id', header: 'Order', render: (o) => <span className="font-mono text-xs font-medium">{o.order_id}</span> },
              { key: 'brand', header: 'Brand', render: (o) => <BrandTag name={o.brand_name} /> },
              { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
              { key: 'total', header: 'Total', align: 'right', render: (o) => formatMoney(o.total_amount) },
              { key: 'bal', header: 'Balance', align: 'right', render: (o) => formatMoney(o.balance_amount) }]
              } />

            }
            {tab === 'payments' &&
            <DataTable
              rows={payments.data}
              loading={payments.loading}
              error={payments.error}
              onRetry={payments.reload}
              getRowKey={(p) => p.payment_id}
              emptyTitle="No payments recorded"
              columns={[
              { key: 'id', header: 'Payment', render: (p) => <span className="font-mono text-xs">{p.payment_id}</span> },
              { key: 'order', header: 'Order', render: (p) => <span className="font-mono text-xs">{p.order_code ?? '—'}</span> },
              { key: 'type', header: 'Type', render: (p) => p.payment_type_display ?? humanize(p.payment_type) },
              { key: 'method', header: 'Method', render: (p) => <span className="text-muted">{p.payment_method_display ?? humanize(p.payment_method)}</span> },
              { key: 'date', header: 'Date', render: (p) => formatDate(p.payment_date) },
              { key: 'amt', header: 'Amount', align: 'right', render: (p) => formatMoney(p.amount) }]
              } />

            }
            {tab === 'notes' &&
            <div className="p-5">
                {canEdit &&
              <form onSubmit={addNote} className="mb-5 flex gap-2">
                    <input aria-label="New note" placeholder="Add a note about this customer…" className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
                    <Button type="submit" variant="primary" loading={pending} disabled={!note.trim()}>Add</Button>
                  </form>
              }
                {c.notes?.length ?
              <ul className="space-y-4">
                    {c.notes.map((n) =>
                <li key={n.id} className="border-l-2 border-line pl-3">
                        <p className="text-sm text-ink">{n.note}</p>
                        <p className="mt-1 text-xs text-faint">{n.user_name} · {formatDateTime(n.created_at)}</p>
                      </li>
                )}
                  </ul> :

              <p className="text-sm text-muted">No notes yet.</p>
              }
              </div>
            }
            {tab === 'documents' &&
            <div className="p-5">
                {canEdit &&
              <form onSubmit={upload} className="mb-5 flex flex-col gap-2 sm:flex-row">
                    <input aria-label="Document title" placeholder="Title" className={inputClass} value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
                    <input aria-label="File" type="file" className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-canvas file:px-3 file:py-2 file:text-sm" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />
                    <Button type="submit" variant="primary" loading={pending} disabled={!docFile}>Upload</Button>
                  </form>
              }
                {c.documents?.length ?
              <ul className="divide-y divide-line">
                    {c.documents.map((d) =>
                <li key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                        <span>{d.title || d.file.split('/').pop()}</span>
                        <a href={fileUrl(d.file)} target="_blank" rel="noreferrer" className="text-accent hover:underline">Open</a>
                      </li>
                )}
                  </ul> :

              <p className="text-sm text-muted">No documents uploaded.</p>
              }
              </div>
            }
          </Panel>
        </div>

        <aside className="order-1 space-y-6 lg:order-2">
          <Panel>
            <p className="text-xs text-muted">Outstanding balance</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${toNumber(c.outstanding_balance) > 0 ? 'text-danger' : 'text-ink'}`}>{formatMoney(c.outstanding_balance)}</p>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Total purchases</dt><dd className="tabular-nums">{formatMoney(c.total_purchases)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Total paid</dt><dd className="tabular-nums">{formatMoney(c.total_paid)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Orders</dt><dd className="tabular-nums">{c.total_orders_count}</dd></div>
            </dl>
          </Panel>
          <Panel title="Details">
            <dl className="space-y-3 text-sm">
              <div><dt className="text-xs text-muted">Billing address</dt><dd>{c.billing_address || '—'}</dd></div>
              <div><dt className="text-xs text-muted">Delivery address</dt><dd>{c.delivery_address || '—'}</dd></div>
              <div><dt className="text-xs text-muted">Tax number</dt><dd>{c.tax_number || '—'}</dd></div>
              {c.general_notes && <div><dt className="text-xs text-muted">Notes</dt><dd className="text-muted">{c.general_notes}</dd></div>}
            </dl>
          </Panel>
        </aside>
      </div>

      <CustomerFormModal open={editing} customer={c} onClose={() => setEditing(false)} onSaved={() => {setEditing(false);customer.reload();}} />
      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={remove}
        pending={pending}
        danger
        title="Archive this customer?"
        message="The customer is hidden from lists but their orders, invoices and payment history are kept for the record."
        confirmLabel="Archive customer" />
      
    </div>);

}