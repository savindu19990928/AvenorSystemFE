import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { PRODUCT_TYPES } from '../../data/workflow';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { BrandPicker } from '../forms/BrandPicker';
import { inputClass } from '../../utils/styles';

const empty = { name: '', code: '', product_type: 'TSHIRT', default_gsm: '', fabric_composition: '', base_price: '', description: '' };

export function ProductFormModal({ open, onClose, onDone, defaultBrand }: {open: boolean;onClose: () => void;onDone: () => void;defaultBrand?: number | null;}) {
  const [brand, setBrand] = useState<number | null>(null);
  const [form, setForm] = useState(empty);
  const { run, pending, fieldErrors } = useAction();

  useEffect(() => {
    if (open) {
      setBrand(defaultBrand ?? null);
      setForm(empty);
    }
  }, [open, defaultBrand]);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await run(() => api.post('/api/catalog/products/', { ...form, brand, base_price: Number(form.base_price).toFixed(2), is_active: true }), 'Product added to catalogue');
    if (res !== undefined) onDone();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="New product"
      description="Products belong to exactly one brand and can't be mixed across brands."
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="product-form" loading={pending} disabled={!brand || !form.name || !form.code || !form.base_price}>
            Add product
          </Button>
        </>
      }>
      
      <form id="product-form" onSubmit={submit} className="space-y-5">
        <BrandPicker value={brand} onChange={setBrand} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="p-name" required error={fieldErrors.name}>
            <input id="p-name" required className={inputClass} value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Product code" htmlFor="p-code" required error={fieldErrors.code}>
            <input id="p-code" required className={inputClass} placeholder="PREM-TSHIRT-220" value={form.code} onChange={set('code')} />
          </Field>
          <Field label="Type" htmlFor="p-type">
            <select id="p-type" className={inputClass} value={form.product_type} onChange={set('product_type')}>
              {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Default GSM" htmlFor="p-gsm">
            <input id="p-gsm" className={inputClass} placeholder="220 GSM" value={form.default_gsm} onChange={set('default_gsm')} />
          </Field>
          <Field label="Fabric composition" htmlFor="p-fab">
            <input id="p-fab" className={inputClass} value={form.fabric_composition} onChange={set('fabric_composition')} />
          </Field>
          <Field label="Base price (Rs.)" htmlFor="p-price" required error={fieldErrors.base_price}>
            <input id="p-price" type="number" min={0} step="0.01" required className={inputClass} value={form.base_price} onChange={set('base_price')} />
          </Field>
          <Field label="Description" htmlFor="p-desc" className="sm:col-span-2">
            <textarea id="p-desc" rows={2} className={inputClass} value={form.description} onChange={set('description')} />
          </Field>
        </div>
      </form>
    </Modal>);

}