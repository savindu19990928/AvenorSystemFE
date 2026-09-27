import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { BrandPicker } from '../forms/BrandPicker';
import { inputClass } from '../../utils/styles';

const empty = { name: '', company_name: '', email: '', phone: '', whatsapp: '', product_name: '', quantity: '', fabric_gsm: '', printing_method: '', requirements: '' };

export function InquiryFormModal({ open, onClose, onCreated }: {open: boolean;onClose: () => void;onCreated: () => void;}) {
  const [brand, setBrand] = useState<number | null>(null);
  const [form, setForm] = useState(empty);
  const { run, pending, fieldErrors } = useAction();

  useEffect(() => {
    if (open) {
      setForm(empty);
      setBrand(null);
    }
  }, [open]);

  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand) return;
    const res = await run(
      () => apiRequest('/api/public/request-a-quote/', { method: 'POST', body: { ...form, brand, quantity: Number(form.quantity) } }),
      'Inquiry logged'
    );
    if (res !== undefined) onCreated();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Log an inquiry"
      description="For phone, WhatsApp or walk-in requests. Website quote requests arrive here automatically."
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="inquiry-form" loading={pending} disabled={!brand}>
            Log inquiry
          </Button>
        </>
      }>
      
      <form id="inquiry-form" onSubmit={submit} className="space-y-5">
        <BrandPicker value={brand} onChange={setBrand} error={fieldErrors.brand} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact name" htmlFor="i-name" required error={fieldErrors.name}>
            <input id="i-name" required className={inputClass} value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Company" htmlFor="i-company">
            <input id="i-company" className={inputClass} value={form.company_name} onChange={set('company_name')} />
          </Field>
          <Field label="Phone" htmlFor="i-phone" required error={fieldErrors.phone}>
            <input id="i-phone" required className={inputClass} value={form.phone} onChange={set('phone')} />
          </Field>
          <Field label="Email" htmlFor="i-email" error={fieldErrors.email}>
            <input id="i-email" type="email" className={inputClass} value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Product requested" htmlFor="i-product">
            <input id="i-product" className={inputClass} placeholder="e.g. Premium T-Shirt 220 GSM" value={form.product_name} onChange={set('product_name')} />
          </Field>
          <Field label="Quantity" htmlFor="i-qty" required error={fieldErrors.quantity}>
            <input id="i-qty" type="number" min={1} required className={inputClass} value={form.quantity} onChange={set('quantity')} />
          </Field>
          <Field label="Fabric / GSM" htmlFor="i-gsm">
            <input id="i-gsm" className={inputClass} value={form.fabric_gsm} onChange={set('fabric_gsm')} />
          </Field>
          <Field label="Printing method" htmlFor="i-print">
            <input id="i-print" className={inputClass} value={form.printing_method} onChange={set('printing_method')} />
          </Field>
          <Field label="Requirements" htmlFor="i-req" className="sm:col-span-2">
            <textarea id="i-req" rows={3} className={inputClass} value={form.requirements} onChange={set('requirements')} />
          </Field>
        </div>
      </form>
    </Modal>);

}