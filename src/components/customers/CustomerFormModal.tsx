import React, { useEffect, useState } from 'react';
import type { Customer } from '../../types/api';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { CUSTOMER_TYPES } from '../../data/workflow';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { inputClass } from '../../utils/styles';

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (customer: Customer) => void;
  customer?: Customer | null;
}

const empty = {
  company_name: '',
  contact_person: '',
  phone: '',
  whatsapp: '',
  email: '',
  customer_type: 'CORPORATE',
  billing_address: '',
  delivery_address: '',
  tax_number: '',
  general_notes: ''
};

type FormState = typeof empty;

export function CustomerFormModal({ open, onClose, onSaved, customer }: CustomerFormModalProps) {
  const [form, setForm] = useState<FormState>(empty);
  const { run, pending, fieldErrors } = useAction();

  useEffect(() => {
    if (!open) return;
    if (customer) {
      setForm({
        company_name: customer.company_name ?? '',
        contact_person: customer.contact_person ?? '',
        phone: customer.phone ?? '',
        whatsapp: customer.whatsapp ?? '',
        email: customer.email ?? '',
        customer_type: customer.customer_type ?? 'CORPORATE',
        billing_address: customer.billing_address ?? '',
        delivery_address: customer.delivery_address ?? '',
        tax_number: customer.tax_number ?? '',
        general_notes: customer.general_notes ?? ''
      });
    } else setForm(empty);
  }, [open, customer]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
  setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await run(
      () => customer ? api.patch<Customer>(`/api/customers/customers/${customer.id}/`, form) : api.post<Customer>('/api/customers/customers/', form),
      customer ? 'Customer updated' : 'Customer created'
    );
    if (saved) onSaved(saved);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={customer ? 'Edit customer' : 'New customer'}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="customer-form" loading={pending}>
            {customer ? 'Save changes' : 'Create customer'}
          </Button>
        </>
      }>
      
      <form id="customer-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Company / customer name" htmlFor="c-company" required error={fieldErrors.company_name}>
          <input id="c-company" required className={inputClass} value={form.company_name} onChange={set('company_name')} />
        </Field>
        <Field label="Contact person" htmlFor="c-contact" required error={fieldErrors.contact_person}>
          <input id="c-contact" required className={inputClass} value={form.contact_person} onChange={set('contact_person')} />
        </Field>
        <Field label="Phone" htmlFor="c-phone" required error={fieldErrors.phone}>
          <input id="c-phone" required className={inputClass} value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label="WhatsApp" htmlFor="c-wa" error={fieldErrors.whatsapp}>
          <input id="c-wa" className={inputClass} value={form.whatsapp} onChange={set('whatsapp')} />
        </Field>
        <Field label="Email" htmlFor="c-email" error={fieldErrors.email}>
          <input id="c-email" type="email" className={inputClass} value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Customer type" htmlFor="c-type">
          <select id="c-type" className={inputClass} value={form.customer_type} onChange={set('customer_type')}>
            {CUSTOMER_TYPES.map((t) =>
            <option key={t.value} value={t.value}>{t.label}</option>
            )}
          </select>
        </Field>
        <Field label="Billing address" htmlFor="c-bill" className="sm:col-span-2" error={fieldErrors.billing_address}>
          <input id="c-bill" className={inputClass} value={form.billing_address} onChange={set('billing_address')} />
        </Field>
        <Field label="Delivery address" htmlFor="c-del" className="sm:col-span-2">
          <input id="c-del" className={inputClass} value={form.delivery_address} onChange={set('delivery_address')} />
        </Field>
        <Field label="Tax / VAT number" htmlFor="c-tax">
          <input id="c-tax" className={inputClass} value={form.tax_number} onChange={set('tax_number')} />
        </Field>
        <Field label="Notes" htmlFor="c-notes" className="sm:col-span-2">
          <textarea id="c-notes" rows={3} className={inputClass} value={form.general_notes} onChange={set('general_notes')} />
        </Field>
      </form>
    </Modal>);

}