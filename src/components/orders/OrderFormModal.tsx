import React, { useEffect, useMemo, useState } from 'react';
import type { Order } from '../../types/api';
import type { DraftLineItem } from '../../types/forms';
import { isDraftItemValid, newDraftItem, toItemPayload } from '../../types/forms';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { formatMoney, todayISO } from '../../utils/format';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { BrandPicker } from '../forms/BrandPicker';
import { CustomerSelect } from '../forms/CustomerSelect';
import { LineItemsEditor } from '../forms/LineItemsEditor';
import { inputClass } from '../../utils/styles';

export function OrderFormModal({ open, onClose, onCreated }: {open: boolean;onClose: () => void;onCreated: (o: Order) => void;}) {
  const [brand, setBrand] = useState<number | null>(null);
  const [customer, setCustomer] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [date, setDate] = useState(todayISO(21));
  const [deposit, setDeposit] = useState('');
  const [requirements, setRequirements] = useState('');
  const [items, setItems] = useState<DraftLineItem[]>([newDraftItem()]);
  const { run, pending } = useAction();

  useEffect(() => {
    if (!open) return;
    setBrand(null);
    setCustomer(null);
    setAddress('');
    setDate(todayISO(21));
    setDeposit('');
    setRequirements('');
    setItems([newDraftItem()]);
  }, [open]);

  const total = useMemo(() => items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0), [items]);
  const valid = !!brand && !!customer && !!address.trim() && items.every(isDraftItemValid);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const order = await run(
      () =>
      api.post<Order>('/api/orders/orders/', {
        brand,
        customer,
        expected_delivery_date: date,
        delivery_address: address,
        deposit_required: Number(deposit || total / 2).toFixed(2),
        printing_embroidery_requirements: requirements,
        items: items.map(toItemPayload)
      }),
      'Order confirmed'
    );
    if (order) onCreated(order);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="New direct order"
      description="For repeat customers who don't need a quotation first."
      footer={
      <>
          {!brand && <span className="mr-auto self-center text-xs text-warn">A brand must be selected before the order can be confirmed.</span>}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="order-form" loading={pending} disabled={!valid}>
            Confirm order · {formatMoney(total)}
          </Button>
        </>
      }>
      
      <form id="order-form" onSubmit={submit} className="space-y-6">
        <BrandPicker
          value={brand}
          onChange={(id) => {
            if (id !== brand) setItems([newDraftItem()]);
            setBrand(id);
          }} />
        
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer" htmlFor="o-customer" required>
            <CustomerSelect
              id="o-customer"
              value={customer}
              onChange={(c) => {
                setCustomer(c?.id ?? null);
                if (c && !address) setAddress(c.delivery_address || c.billing_address || '');
              }} />
            
          </Field>
          <Field label="Expected delivery date" htmlFor="o-date" required>
            <input id="o-date" type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Delivery address" htmlFor="o-addr" required>
            <input id="o-addr" className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <Field label="Deposit required" htmlFor="o-dep" hint={`Leave blank for 50% (${formatMoney(total / 2)})`}>
            <input id="o-dep" type="number" min={0} className={inputClass} value={deposit} onChange={(e) => setDeposit(e.target.value)} />
          </Field>
          <Field label="Printing / embroidery requirements" htmlFor="o-req" className="sm:col-span-2">
            <input id="o-req" className={inputClass} value={requirements} onChange={(e) => setRequirements(e.target.value)} />
          </Field>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink">Line items<span className="ml-0.5 text-danger">*</span></p>
          <LineItemsEditor brandId={brand} items={items} onChange={setItems} />
        </div>
      </form>
    </Modal>);

}