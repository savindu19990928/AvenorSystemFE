import React, { useEffect, useState } from 'react';
import type { InventoryItem } from '../../types/api';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { formatNumber } from '../../utils/format';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { inputClass } from '../../utils/styles';

interface StockAdjustModalProps {
  item: InventoryItem | null;
  mode: 'receive' | 'damaged';
  onClose: () => void;
  onDone: () => void;
}

export function StockAdjustModal({ item, mode, onClose, onDone }: StockAdjustModalProps) {
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [reference, setReference] = useState('');
  const [text, setText] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const { run, pending } = useAction();

  useEffect(() => {
    if (!item) return;
    setQty('');
    setCost(String(Number(item.unit_cost)));
    setReference('');
    setText('');
    setOrderCode('');
  }, [item]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    const res =
    mode === 'receive' ?
    await run(
      () => api.post(`/api/inventory/inventory-items/${item.id}/receive-stock/`, { quantity: Number(qty), unit_cost: Number(cost).toFixed(2), reference, notes: text }),
      `${qty} pcs received into ${item.sku}`
    ) :
    await run(
      () => api.post(`/api/inventory/inventory-items/${item.id}/report-damaged/`, { quantity: Number(qty), reason: text, order_id: orderCode || undefined }),
      `${qty} damaged pcs deducted`
    );
    if (res !== undefined) onDone();
  };

  const valid = Number(qty) > 0 && (mode === 'receive' || text.trim());

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title={mode === 'receive' ? 'Receive stock' : 'Report damaged stock'}
      description={item ? `${item.sku} · ${formatNumber(item.quantity_on_hand)} on hand` : undefined}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant={mode === 'receive' ? 'primary' : 'danger'} type="submit" form="stock-form" loading={pending} disabled={!valid}>
            {mode === 'receive' ? 'Receive' : 'Deduct damaged'}
          </Button>
        </>
      }>
      
      <form id="stock-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quantity" htmlFor="sa-qty" required>
            <input id="sa-qty" type="number" min={1} required className={inputClass} value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
          {mode === 'receive' ?
          <Field label="Unit cost (Rs.)" htmlFor="sa-cost">
              <input id="sa-cost" type="number" min={0} step="0.01" className={inputClass} value={cost} onChange={(e) => setCost(e.target.value)} />
            </Field> :

          <Field label="Related order ID" htmlFor="sa-order" hint="Optional">
              <input id="sa-order" className={inputClass} placeholder="ORD-2026-000125" value={orderCode} onChange={(e) => setOrderCode(e.target.value)} />
            </Field>
          }
        </div>
        {mode === 'receive' &&
        <Field label="Supplier / PO reference" htmlFor="sa-ref">
            <input id="sa-ref" className={inputClass} value={reference} onChange={(e) => setReference(e.target.value)} />
          </Field>
        }
        <Field label={mode === 'receive' ? 'Notes' : 'Reason'} htmlFor="sa-text" required={mode === 'damaged'}>
          <textarea id="sa-text" rows={2} required={mode === 'damaged'} className={inputClass} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
      </form>
    </Modal>);

}