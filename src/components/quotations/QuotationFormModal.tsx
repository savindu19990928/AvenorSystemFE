import React, { useEffect, useMemo, useState } from 'react';
import type { Quotation } from '../../types/api';
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
import { DepositPercentInput } from '../forms/DepositPercentInput';
import { DEFAULT_DEPOSIT_PERCENT } from '../../data/workflow';
import { depositTerms, isValidPercent } from '../../utils/billing';
import { inputClass } from '../../utils/styles';

export interface QuotationPrefill {
  brand?: number;
  customer?: number;
  inquiry?: number;
  quantity?: string;
  fabric_gsm?: string;
  printing_method?: string;
  notes?: string;
}

interface QuotationFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (q: Quotation) => void;
  prefill?: QuotationPrefill | null;
}

export function QuotationFormModal({ open, onClose, onCreated, prefill }: QuotationFormModalProps) {
  const [brand, setBrand] = useState<number | null>(null);
  const [customer, setCustomer] = useState<number | null>(null);
  const [items, setItems] = useState<DraftLineItem[]>([newDraftItem()]);
  const [validity, setValidity] = useState(todayISO(30));
  const [depositPct, setDepositPct] = useState(String(DEFAULT_DEPOSIT_PERCENT));
  const [artwork, setArtwork] = useState('0');
  const [delivery, setDelivery] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [taxRate, setTaxRate] = useState('0');
  const [notes, setNotes] = useState('');
  const { run, pending } = useAction();

  useEffect(() => {
    if (!open) return;
    setBrand(prefill?.brand ?? null);
    setCustomer(prefill?.customer ?? null);
    setItems([newDraftItem({ quantity: prefill?.quantity ?? '', fabric_gsm: prefill?.fabric_gsm ?? '', printing_method: prefill?.printing_method ?? '' })]);
    setValidity(todayISO(30));
    setDepositPct(String(DEFAULT_DEPOSIT_PERCENT));
    setArtwork('0');
    setDelivery('0');
    setDiscount('0');
    setTaxRate('0');
    setNotes(prefill?.notes ?? '');
  }, [open, prefill]);

  const changeBrand = (id: number) => {
    if (id === brand) return;
    setBrand(id);
    setItems([newDraftItem()]);
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0);
    const extras = Number(artwork || 0) + Number(delivery || 0) - Number(discount || 0);
    const tax = (subtotal + extras) * Number(taxRate || 0) / 100;
    return { subtotal, tax, total: subtotal + extras + tax };
  }, [items, artwork, delivery, discount, taxRate]);

  const valid = !!brand && !!customer && isValidPercent(depositPct) && items.length > 0 && items.every(isDraftItemValid);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const created = await run(
      () =>
      api.post<Quotation>('/api/quotations/quotations/', {
        brand,
        customer,
        inquiry: prefill?.inquiry ?? null,
        validity_date: validity,
        payment_terms: depositTerms(Number(depositPct)),
        artwork_charges: Number(artwork || 0).toFixed(2),
        delivery_charges: Number(delivery || 0).toFixed(2),
        discount_amount: Number(discount || 0).toFixed(2),
        tax_rate_percent: Number(taxRate || 0).toFixed(2),
        notes,
        items: items.map(toItemPayload)
      }),
      'Quotation created'
    );
    if (created) onCreated(created);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="New quotation"
      description="Totals are recalculated by the server when saved."
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="quotation-form" loading={pending} disabled={!valid}>
            Create quotation
          </Button>
        </>
      }>
      
      <form id="quotation-form" onSubmit={submit} className="space-y-6">
        <BrandPicker value={brand} onChange={changeBrand} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Customer" htmlFor="q-customer" required className="sm:col-span-1">
            <CustomerSelect id="q-customer" value={customer} onChange={(c) => setCustomer(c?.id ?? null)} />
          </Field>
          <Field label="Valid until" htmlFor="q-valid" required>
            <input id="q-valid" type="date" className={inputClass} value={validity} onChange={(e) => setValidity(e.target.value)} />
          </Field>
          <DepositPercentInput id="q-terms" label="Deposit to start order" value={depositPct} onChange={setDepositPct} total={totals.total} />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-ink">Line items<span className="ml-0.5 text-danger">*</span></p>
          <LineItemsEditor brandId={brand} items={items} onChange={setItems} />
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_280px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Artwork / design charges" htmlFor="q-art">
              <input id="q-art" type="number" min={0} className={inputClass} value={artwork} onChange={(e) => setArtwork(e.target.value)} />
            </Field>
            <Field label="Delivery charges" htmlFor="q-del">
              <input id="q-del" type="number" min={0} className={inputClass} value={delivery} onChange={(e) => setDelivery(e.target.value)} />
            </Field>
            <Field label="Discount" htmlFor="q-disc" hint="Discounts are recorded in the audit log.">
              <input id="q-disc" type="number" min={0} className={inputClass} value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </Field>
            <Field label="Tax rate %" htmlFor="q-tax">
              <input id="q-tax" type="number" min={0} step="0.01" className={inputClass} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
            </Field>
            <Field label="Notes" htmlFor="q-notes" className="sm:col-span-2">
              <textarea id="q-notes" rows={2} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </div>
          <dl className="h-fit space-y-2 rounded-lg bg-canvas p-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatMoney(totals.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Artwork + delivery</dt><dd className="tabular-nums">{formatMoney(Number(artwork || 0) + Number(delivery || 0))}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd className="tabular-nums">−{formatMoney(discount)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="tabular-nums">{formatMoney(totals.tax)}</dd></div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Estimated total</dt><dd className="tabular-nums">{formatMoney(totals.total)}</dd></div>
          </dl>
        </div>
      </form>
    </Modal>);

}