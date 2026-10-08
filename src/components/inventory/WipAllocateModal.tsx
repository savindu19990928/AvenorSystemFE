import React, { useEffect, useState } from 'react';
import type { Order, StageName, WipItem } from '../../types/api';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { formatNumber } from '../../utils/format';
import { stageLabel, stagesAfter } from '../../utils/production';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { OrderSelect } from '../forms/OrderSelect';
import { inputClass } from '../../utils/styles';

interface WipAllocateModalProps {
  item: WipItem | null;
  onClose: () => void;
  onDone: () => void;
}

export function WipAllocateModal({ item, onClose, onDone }: WipAllocateModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [quantity, setQuantity] = useState('');
  const [target, setTarget] = useState<StageName | ''>('');
  const [notes, setNotes] = useState('');
  const { run, pending } = useAction();
  const options = item ? stagesAfter(item.stage_completed) : [];

  useEffect(() => {
    if (!item) return;
    setOrder(null);
    setQuantity('');
    setTarget(stagesAfter(item.stage_completed)[0] ?? '');
    setNotes('');
  }, [item]);

  const qty = Math.floor(Number(quantity || 0));
  const valid = !!order && !!target && qty > 0 && qty <= (item?.available_quantity ?? 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !valid || !order) return;
    const res = await run(
      () => api.post(`/api/inventory/wip/${item.id}/allocate-to-order/`, { order_id: order.order_id, quantity: qty, target_stage: target, notes }),
      `${qty} units allocated to ${order.order_id}`
    );
    if (res !== undefined) onDone();
  };

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title="Use stored stock in an order"
      description={item ? `${item.product_name} · ${item.colour} · ${item.size} — finished ${stageLabel(item.stage_completed)}, ${formatNumber(item.available_quantity)} available.` : undefined}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="wip-allocate-form" loading={pending} disabled={!valid}>
            Allocate {qty > 0 ? formatNumber(qty) : ''}
          </Button>
        </>
      }>
      
      <form id="wip-allocate-form" onSubmit={submit} className="space-y-4">
        <Field label="Order" htmlFor="wa-order" required>
          <OrderSelect id="wa-order" value={order?.id ?? null} onChange={setOrder} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quantity" htmlFor="wa-qty" hint={item ? `Up to ${formatNumber(item.available_quantity)}` : undefined} required>
            <input id="wa-qty" type="number" min={1} max={item?.available_quantity} className={inputClass} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </Field>
          <Field label="Start the order at" htmlFor="wa-stage" hint="Earlier steps are skipped for these units." required>
            <select id="wa-stage" className={inputClass} value={target} onChange={(e) => setTarget(e.target.value as StageName)} disabled={options.length === 0}>
              {options.length === 0 && <option value="">No later steps</option>}
              {options.map((s) =>
              <option key={s} value={s}>{stageLabel(s)}</option>
              )}
            </select>
          </Field>
        </div>
        <Field label="Notes" htmlFor="wa-notes">
          <textarea id="wa-notes" rows={2} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Modal>);

}