import React, { useEffect, useState } from 'react';
import type { ConvertInvoiceResult, Invoice } from '../../types/api';
import type { ProcessConfig, WipAllocations } from '../../types/production';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { formatMoney, toNumber } from '../../utils/format';
import { PAYMENT_METHODS } from '../../data/workflow';
import { invoiceDepositAmount, invoiceDepositPercent } from '../../utils/billing';
import { allocateWip, defaultProcess, processPayload } from '../../utils/production';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { ProductionPlanFields } from '../production/ProductionPlanFields';
import { inputClass } from '../../utils/styles';

interface ConvertInvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onDone: (result: ConvertInvoiceResult) => void;
}

export function ConvertInvoiceModal({ invoice, onClose, onDone }: ConvertInvoiceModalProps) {
  const [method, setMethod] = useState(PAYMENT_METHODS[1].value);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [process, setProcess] = useState<ProcessConfig>(defaultProcess());
  const [allocations, setAllocations] = useState<WipAllocations>({});
  const { run, pending } = useAction();

  useEffect(() => {
    if (!invoice) return;
    setMethod(PAYMENT_METHODS[1].value);
    setReference('');
    setNotes('');
    setProcess(defaultProcess());
    setAllocations({});
  }, [invoice]);

  const total = toNumber(invoice?.total_amount);
  const pct = invoice ? invoiceDepositPercent(invoice) : 0;
  const deposit = invoice ? invoiceDepositAmount(invoice) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice?.id) return;
    const res = await run(async () => {
      const result = await api.post<ConvertInvoiceResult>(`/api/billing/invoices/${invoice.id}/convert-to-order/`, {
        payment_method: method,
        reference_number: reference,
        ...processPayload(process),
        notes
      });
      await allocateWip(result.order.order_id, process, allocations);
      return result;
    }, 'Deposit recorded — order is running');
    if (res) onDone(res);
  };

  return (
    <Modal
      open={!!invoice}
      onClose={onClose}
      size="lg"
      title={`Start order from ${invoice?.invoice_number ?? 'invoice'}`}
      description="Confirms the customer paid the deposit. The payment is recorded and a deposit-only bill is issued automatically."
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="convert-invoice-form" loading={pending} disabled={process.order.length === 0}>
            Record {formatMoney(deposit)} deposit & start
          </Button>
        </>
      }>
      
      <form id="convert-invoice-form" onSubmit={submit} className="space-y-5">
        <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line text-sm">
          <div className="bg-surface p-3">
            <dt className="text-xs text-muted">Invoice total</dt>
            <dd className="mt-0.5 tabular-nums">{formatMoney(total)}</dd>
          </div>
          <div className="bg-surface p-3">
            <dt className="text-xs text-muted">Deposit · {pct}%</dt>
            <dd className="mt-0.5 text-base font-semibold tabular-nums text-ink">{formatMoney(deposit)}</dd>
          </div>
          <div className="bg-surface p-3">
            <dt className="text-xs text-muted">Balance after</dt>
            <dd className="mt-0.5 tabular-nums">{formatMoney(total - deposit)}</dd>
          </div>
        </dl>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Deposit paid by" htmlFor="ci-method" required>
            <select id="ci-method" className={inputClass} value={method} onChange={(e) => setMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) =>
              <option key={m.value} value={m.value}>{m.label}</option>
              )}
            </select>
          </Field>
          <Field label="Reference number" htmlFor="ci-ref">
            <input id="ci-ref" className={inputClass} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. bank slip or cheque no." />
          </Field>
        </div>

        <ProductionPlanFields
          idPrefix="ci-proc"
          brandId={invoice?.brand}
          config={process}
          onConfigChange={setProcess}
          allocations={allocations}
          onAllocationsChange={setAllocations} />
        

        <Field label="Notes" htmlFor="ci-notes">
          <textarea id="ci-notes" rows={2} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Modal>);

}