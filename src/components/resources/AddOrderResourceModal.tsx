import React, { useEffect, useState } from 'react';
import type { OrderDetail } from '../../types/api';
import type { OrderResourceUsage, Resource } from '../../types/resources';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { useAction } from '../../hooks/useAction';
import { formatMoney, toNumber } from '../../utils/format';
import { formatQty, resourcesForBrand } from '../../utils/resources';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { cx, inputClass } from '../../utils/styles';

interface AddOrderResourceModalProps {
  order: OrderDetail;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

export function AddOrderResourceModal({ order, open, onClose, onDone }: AddOrderResourceModalProps) {
  const { data, loading } = useApi(() => open ? api.list<Resource>('/api/inventory/resources/', { is_active: true }) : Promise.resolve(null), [open]);
  const resources = resourcesForBrand(data ?? [], order.brand);
  const [resourceId, setResourceId] = useState('');
  const [qty, setQty] = useState('');
  const [itemId, setItemId] = useState('');
  const [notes, setNotes] = useState('');
  const { run, pending, fieldErrors } = useAction();

  useEffect(() => {
    if (!open) return;
    setResourceId('');
    setQty('');
    setItemId('');
    setNotes('');
  }, [open]);

  const r = resources.find((x) => x.id === Number(resourceId));
  const unit = r?.unit_of_measurement ?? '';
  const over = !!r && toNumber(qty) > toNumber(r.current_stock_quantity);
  const valid = !!r && toNumber(qty) > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !r) return;
    const res = await run(
      () =>
      api.post<OrderResourceUsage>(`/api/orders/orders/${order.id}/resources/`, {
        resource_id: r.id,
        quantity_used: toNumber(qty).toFixed(2),
        ...(itemId ? { order_item_id: Number(itemId) } : {}),
        notes: notes.trim()
      }),
      `${formatQty(qty, unit)} of ${r.name} added to ${order.order_id}`
    );
    if (res) onDone();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add material to order"
      description="The quantity is taken out of material stock."
      footer={
      <>
          {r && toNumber(qty) > 0 &&
        <span className="mr-auto self-center text-sm text-muted">
              Cost <span className="font-semibold tabular-nums text-ink">{formatMoney(toNumber(qty) * toNumber(r.unit_cost))}</span>
            </span>
        }
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="order-resource-form" loading={pending} disabled={!valid}>
            Add material
          </Button>
        </>
      }>
      
      <form id="order-resource-form" onSubmit={submit} className="space-y-4">
        <Field
          label="Material"
          htmlFor="or-res"
          required
          error={fieldErrors.resource_id}
          hint={r ? `${formatQty(r.current_stock_quantity, unit)} in stock · ${formatMoney(r.unit_cost)}/${unit}` : undefined}>
          
          <select id="or-res" className={inputClass} value={resourceId} disabled={loading} onChange={(e) => setResourceId(e.target.value)}>
            <option value="">{loading ? 'Loading materials…' : 'Select material'}</option>
            <optgroup label="Fabrics (kg)">
              {resources.filter((x) => x.resource_type === 'FABRIC').map((x) =>
              <option key={x.id} value={x.id}>{x.name}</option>
              )}
            </optgroup>
            <optgroup label="Other resources">
              {resources.filter((x) => x.resource_type === 'OTHER').map((x) =>
              <option key={x.id} value={x.id}>{x.name} ({x.unit_of_measurement})</option>
              )}
            </optgroup>
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quantity used" htmlFor="or-qty" required error={fieldErrors.quantity_used ?? (over ? 'More than is in stock' : undefined)}>
            <div className="relative">
              <input id="or-qty" type="number" min={0} step="0.01" className={cx(inputClass, 'pr-16')} value={qty} onChange={(e) => setQty(e.target.value)} />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-faint">{unit || 'unit'}</span>
            </div>
          </Field>
          <Field label="For line item" htmlFor="or-item" hint="Leave as whole order to share the cost by quantity">
            <select id="or-item" className={inputClass} value={itemId} onChange={(e) => setItemId(e.target.value)}>
              <option value="">Whole order</option>
              {order.items.filter((i) => i.id).map((i) =>
              <option key={i.id} value={i.id}>
                  {i.product_name} · {i.quantity} pcs
                </option>
              )}
            </select>
          </Field>
        </div>
        <Field label="Note" htmlFor="or-notes">
          <input id="or-notes" className={inputClass} placeholder="e.g. Extra ink for re-prints" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Modal>);

}