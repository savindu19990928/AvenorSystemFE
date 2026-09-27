import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Product } from '../../types/api';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { SIZES } from '../../data/workflow';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { inputClass } from '../../utils/styles';

export function SpecFormModal({ product, onClose, onDone }: {product: Product | null;onClose: () => void;onDone: () => void;}) {
  const [size, setSize] = useState('M');
  const [colour, setColour] = useState('');
  const [gsm, setGsm] = useState('');
  const [extra, setExtra] = useState('0');
  const { run, pending } = useAction();

  useEffect(() => {
    if (!product) return;
    setSize('M');
    setColour('');
    setGsm(product.default_gsm);
    setExtra('0');
  }, [product]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    const res = await run<{sku?: string;}>(
      () => api.post(`/api/catalog/products/${product.id}/specifications/`, { size, colour, gsm, additional_price: Number(extra || 0).toFixed(2) })
    );
    if (res !== undefined) {
      toast.success(res?.sku ? `SKU ${res.sku} created` : 'Variant added');
      onDone();
    }
  };

  return (
    <Modal
      open={!!product}
      onClose={onClose}
      title="Add size / colour variant"
      description={product ? `${product.name} — SKU is generated automatically.` : undefined}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="spec-form" loading={pending} disabled={!colour.trim()}>
            Add variant
          </Button>
        </>
      }>
      
      <form id="spec-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Size" htmlFor="sp-size">
          <select id="sp-size" className={inputClass} value={size} onChange={(e) => setSize(e.target.value)}>
            {SIZES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Colour" htmlFor="sp-colour" required>
          <input id="sp-colour" required className={inputClass} value={colour} onChange={(e) => setColour(e.target.value)} />
        </Field>
        <Field label="GSM" htmlFor="sp-gsm">
          <input id="sp-gsm" className={inputClass} value={gsm} onChange={(e) => setGsm(e.target.value)} />
        </Field>
        <Field label="Additional price (Rs.)" htmlFor="sp-extra">
          <input id="sp-extra" type="number" min={0} step="0.01" className={inputClass} value={extra} onChange={(e) => setExtra(e.target.value)} />
        </Field>
      </form>
    </Modal>);

}