import React, { useState } from 'react';
import { ReceiptIcon, WalletIcon, CoinsIcon, PrinterIcon, PlayIcon } from 'lucide-react';
import type { Bill, Invoice, OrderDetail, Payment } from '../../types/api';
import { canConvertInvoice, invoiceDepositAmount, invoiceDepositPercent } from '../../utils/billing';
import { ConvertInvoiceModal } from '../workflow/ConvertInvoiceModal';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { useAction } from '../../hooks/useAction';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatMoney, humanize, toNumber } from '../../utils/format';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { PaymentFormModal } from '../workflow/PaymentFormModal';
import { GenerateInvoiceModal } from '../workflow/GenerateInvoiceModal';
import { ExpenseFormModal } from '../workflow/ExpenseFormModal';
import { InvoicePrintModal } from '../documents/InvoicePrintModal';
import { ReceiptPrintModal } from '../documents/ReceiptPrintModal';

export function OrderBillingTab({ order, onChanged }: {order: OrderDetail;onChanged: () => void;}) {
  const { hasRole } = useAuth();
  const canAct = hasRole('ADMIN', 'ACCOUNTS');
  const [paying, setPaying] = useState(false);
  const [invoicing, setInvoicing] = useState(false);
  const [expensing, setExpensing] = useState(false);
  const [cancelling, setCancelling] = useState<Invoice | null>(null);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const { run, pending } = useAction();
  const invoiceList = useApi(
    () => api.list<Invoice>('/api/billing/invoices/', { order: order.id }).then((l) => l.filter((i) => i.order === order.id || i.order_code === order.order_id)),
    [order.id]
  );
  const [converting, setConverting] = useState<Invoice | null>(null);
  const billList = useApi(() => api.list<Bill>('/api/billing/bills/', { order: order.id }).then((l) => l.filter((b) => b.order === order.id || b.order_code === order.order_id)), [order.id]);
  const bills = billList.data ?? [];
  const invoices = invoiceList.data?.length ? invoiceList.data : order.invoices ?? [];
  const payments = order.payments ?? [];
  const profit = order.profit_summary;
  const depositPaid = payments.filter((p) => p.payment_type === 'DEPOSIT').reduce((s, p) => s + toNumber(p.amount), 0);

  const refresh = () => {
    invoiceList.reload();
    billList.reload();
    onChanged();
  };

  const cancelInvoice = async (reason: string) => {
    if (!cancelling?.id) return;
    const res = await run(() => api.post(`/api/billing/invoices/${cancelling.id}/cancel/`, { reason }), 'Invoice marked as cancelled');
    if (res !== undefined) {
      setCancelling(null);
      refresh();
    }
  };

  const ref = { id: order.id, order_id: order.order_id, balance_amount: order.balance_amount, total_amount: order.total_amount };

  return (
    <div className="space-y-6 p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-canvas p-4">
          <p className="text-xs text-muted">Deposit</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatMoney(depositPaid)} <span className="text-sm font-normal text-muted">of {formatMoney(order.deposit_required)}</span></p>
        </div>
        <div className="rounded-lg bg-canvas p-4">
          <p className="text-xs text-muted">Paid to date</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatMoney(order.paid_amount)}</p>
        </div>
        <div className="rounded-lg bg-canvas p-4">
          <p className="text-xs text-muted">Balance due</p>
          <p className={`mt-1 text-lg font-semibold tabular-nums ${toNumber(order.balance_amount) > 0 ? 'text-danger' : 'text-ok'}`}>{formatMoney(order.balance_amount)}</p>
        </div>
      </div>

      {canAct &&
      <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={WalletIcon} onClick={() => setPaying(true)}>Record payment</Button>
          <Button icon={ReceiptIcon} onClick={() => setInvoicing(true)}>Generate invoice</Button>
          <Button icon={CoinsIcon} onClick={() => setExpensing(true)}>Add expense</Button>
        </div>
      }

      <section>
        <h3 className="mb-2 text-sm font-semibold">Invoices</h3>
        {invoices.length === 0 ?
        <p className="text-sm text-muted">No invoice generated yet.</p> :

        <ul className="divide-y divide-line rounded-lg border border-line">
            {invoices.map((i) =>
          <li key={i.invoice_number} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="font-mono text-xs font-medium">{i.invoice_number}</span>
                <StatusBadge status={i.status} />
                <span className="text-muted">{i.due_date ? `Due ${formatDate(i.due_date)}` : ''}</span>
                <span className="text-xs text-muted">{invoiceDepositPercent(i)}% deposit · {formatMoney(invoiceDepositAmount(i))}</span>
                <span className="ml-auto tabular-nums">{formatMoney(i.total_amount)} <span className="text-muted">· bal {formatMoney(i.balance_amount)}</span></span>
                {canAct && canConvertInvoice(i) &&
            <Button size="sm" variant="primary" icon={PlayIcon} onClick={() => setConverting(i)}>Deposit paid</Button>
            }
                <Button size="sm" variant="ghost" icon={PrinterIcon} onClick={() => setPrintInvoice(i)}>Print</Button>
                {canAct && i.id && i.status !== 'CANCELLED' &&
            <Button size="sm" variant="ghost" onClick={() => setCancelling(i)}>Cancel</Button>
            }
              </li>
          )}
          </ul>
        }
      </section>

      {bills.length > 0 &&
      <section>
          <h3 className="mb-2 text-sm font-semibold">Bills</h3>
          <ul className="divide-y divide-line rounded-lg border border-line">
            {bills.map((b) =>
          <li key={b.bill_number} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="font-mono text-xs font-medium">{b.bill_number}</span>
                {b.is_deposit_only ?
            <span className="rounded bg-warn-soft px-1.5 py-0.5 text-xs font-medium text-warn">
                    Deposit only{b.deposit_percentage ? ` · ${toNumber(b.deposit_percentage)}%` : ''}
                  </span> :

            <span className="rounded bg-canvas px-1.5 py-0.5 text-xs text-muted">Full</span>
            }
                {b.bill_date && <span className="text-muted">{formatDate(b.bill_date)}</span>}
                <span className="ml-auto text-right">
                  <span className="font-medium tabular-nums">{formatMoney(b.amount)}</span>
                  {b.is_deposit_only && b.total_order_amount &&
              <span className="block text-xs text-muted tabular-nums">
                      of {formatMoney(b.total_order_amount)} · {formatMoney(b.balance_remaining)} still due
                    </span>
              }
                </span>
              </li>
          )}
          </ul>
        </section>
      }

      <section>
        <h3 className="mb-2 text-sm font-semibold">Payments</h3>
        {payments.length === 0 ?
        <p className="text-sm text-muted">No payments recorded.</p> :

        <ul className="divide-y divide-line rounded-lg border border-line">
            {payments.map((p) =>
          <li key={p.payment_id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="font-mono text-xs">{p.payment_id}</span>
                <span className="rounded bg-canvas px-1.5 py-0.5 text-xs text-muted">{p.payment_type_display ?? humanize(p.payment_type)}</span>
                <span className="text-muted">{p.payment_method_display ?? humanize(p.payment_method)}</span>
                <span className="ml-auto font-medium tabular-nums">{formatMoney(p.amount)}</span>
                <Button size="sm" variant="ghost" icon={PrinterIcon} onClick={() => setReceipt(p)}>Receipt</Button>
              </li>
          )}
          </ul>
        }
      </section>

      {profit && hasRole('ADMIN', 'ACCOUNTS') &&
      <section className="rounded-lg border border-line p-4">
          <h3 className="text-sm font-semibold">Profit</h3>
          <p className="mt-0.5 text-xs text-muted">Revenue − t-shirt, printing, labour, packaging, delivery and other costs ({profit.expense_count} expenses)</p>
          <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-2 text-sm">
            <div><p className="text-xs text-muted">Revenue</p><p className="tabular-nums">{formatMoney(profit.revenue)}</p></div>
            <div><p className="text-xs text-muted">Expenses</p><p className="tabular-nums">−{formatMoney(profit.total_expenses)}</p></div>
            <div><p className="text-xs text-muted">Estimated profit</p><p className="text-lg font-semibold tabular-nums text-ok">{formatMoney(profit.estimated_profit)}</p></div>
            <div><p className="text-xs text-muted">Margin</p><p className="font-medium tabular-nums">{profit.profit_margin_percent}%</p></div>
          </div>
        </section>
      }

      <PaymentFormModal open={paying} order={ref} defaultType={depositPaid < toNumber(order.deposit_required) ? 'DEPOSIT' : 'BALANCE'} onClose={() => setPaying(false)} onDone={() => {setPaying(false);refresh();}} />
      <GenerateInvoiceModal open={invoicing} order={ref} onClose={() => setInvoicing(false)} onDone={() => {setInvoicing(false);refresh();}} />
      <ConvertInvoiceModal invoice={converting} onClose={() => setConverting(null)} onDone={() => {setConverting(null);refresh();}} />
      <ExpenseFormModal open={expensing} order={ref} onClose={() => setExpensing(false)} onDone={() => {setExpensing(false);refresh();}} />
      <InvoicePrintModal invoice={printInvoice} onClose={() => setPrintInvoice(null)} />
      <ReceiptPrintModal payment={receipt} order={order} onClose={() => setReceipt(null)} />
      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={cancelInvoice}
        pending={pending}
        danger
        title={`Cancel ${cancelling?.invoice_number ?? 'invoice'}?`}
        message="The invoice is kept on record and marked Cancelled — it is never deleted."
        confirmLabel="Mark cancelled"
        reasonLabel="Reason"
        reasonRequired />
      
    </div>);

}