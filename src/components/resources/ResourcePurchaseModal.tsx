import React, { useEffect, useMemo, useState } from 'react';
import type { Resource, ResourcePurchase } from '../../types/resources';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { formatMoney, todayISO, toNumber } from '../../utils/format';
import { formatQty, RESOURCE_TYPE_LABEL } from '../../utils/resources';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { cx, inputClass } from '../../utils/styles';

interface ResourcePurchaseModalProps {
  open: boolean;
  resources: Resource[];
  initialResourceId?: number | null;
  onClose: () => void;
  onDone: (p: ResourcePurchase) => void;
}

export function ResourcePurchaseModal({ open, resources, initialResourceId, onClose, onDone }: ResourcePurchaseModalProps) {
  const [resourceId, setResourceId] = useState('');
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [supplier, setSupplier] = useState('');
  const [invoice, setInvoice] = useState('');
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const { run, pending, fieldErrors } = useAction();

  const resource = useMemo(() => resources.find((r) => r.id === Number(resourceId)) ?? null, [resources, resourceId]);

  useEffect(() => {
    if (!open) return;
    const initial = resources.find((r) => r.id === initialResourceId);
    setResourceId(initial ? String(initial.id) : '');
    setCost(initial && toNumber(initial.unit_cost) > 0 ? String(toNumber(initial.unit_cost)) : '');
    setQty('');
    setSupplier('');
    setInvoice('');
    setDate(todayISO());
    setNotes('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialResourceId]);

  const total = toNumber(qty) * toNumber(cost);
  const valid = !!resource && toNumber(qty) > 0 && cost !== '' && toNumber(cost) >= 0 && !!date;
  const unit = resource?.unit_of_measurement ?? '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !resource) return;
    const created = await run(
      () =>
      api.post<ResourcePurchase>('/api/inventory/resource-purchases/', {
        resource_id: resource.id,
        quantity: toNumber(qty).toFixed(2),
        unit_cost: toNumber(cost).toFixed(2),
        supplier_name: supplier.trim(),
        invoice_number: invoice.trim(),
        purchase_date: date,
        notes: notes.trim()
      }),
      `Purchase of ${formatQty(qty, unit)} recorded as expense`
    );
    if (created) onDone(created);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record purchase"
      description="Logged as a company expense and added to material stock."
      footer={
      <>
          <span className="mr-auto self-center text-sm text-muted">
            Expense <span className="font-semibold tabular-nums text-ink">{formatMoney(total)}</span>
          </span>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="purchase-form" loading={pending} disabled={!valid}>
            Record purchase
          </Button>
        </>
      }>
      
      <form id="purchase-form" onSubmit={submit} className="space-y-4">
        <Field
          label="Resource"
          htmlFor="rp-resource"
          required
          error={fieldErrors.resource_id}
          hint={resource ? `${RESOURCE_TYPE_LABEL[resource.resource_type]} · ${formatQty(resource.current_stock_quantity, unit)} in stock` : undefined}>
          
          <select
            id="rp-resource"
            className={inputClass}
            value={resourceId}
            onChange={(e) => {
              setResourceId(e.target.value);
              const r = resources.find((x) => x.id === Number(e.target.value));
              if (r && toNumber(r.unit_cost) > 0) setCost(String(toNumber(r.unit_cost)));
            }}>
            
            <option value="">Select a resource</option>
            <optgroup label="Fabrics (kg)">
              {resources.filter((r) => r.resource_type === 'FABRIC').map((r) =>
              <option key={r.id} value={r.id}>{r.name}</option>
              )}
            </optgroup>
            <optgroup label="Other resources">
              {resources.filter((r) => r.resource_type === 'OTHER').map((r) =>
              <option key={r.id} value={r.id}>{r.name} ({r.unit_of_measurement})</option>
              )}
            </optgroup>
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quantity bought" htmlFor="rp-qty" required error={fieldErrors.quantity}>
            <div className="relative">
              <input id="rp-qty" type="number" min={0} step="0.01" className={cx(inputClass, 'pr-16')} value={qty} onChange={(e) => setQty(e.target.value)} />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-faint">{unit || 'units'}</span>
            </div>
          </Field>
          <Field label={`Cost per ${unit || 'unit'} (Rs.)`} htmlFor="rp-cost" required error={fieldErrors.unit_cost}>
            <input id="rp-cost" type="number" min={0} step="0.01" className={inputClass} value={cost} onChange={(e) => setCost(e.target.value)} />
          </Field>
          <Field label="Supplier" htmlFor="rp-supplier">
            <input id="rp-supplier" className={inputClass} placeholder="Hayleys Fabrics PLC" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          </Field>
          <Field label="Supplier invoice no." htmlFor="rp-invoice">
            <input id="rp-invoice" className={inputClass} placeholder="INV-HF-9901" value={invoice} onChange={(e) => setInvoice(e.target.value)} />
          </Field>
          <Field label="Purchase date" htmlFor="rp-date" required error={fieldErrors.purchase_date}>
            <input id="rp-date" type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        <Field label="Notes" htmlFor="rp-notes">
          <textarea id="rp-notes" rows={2} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Modal>);

}