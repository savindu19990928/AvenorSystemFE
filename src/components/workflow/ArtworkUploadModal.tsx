import React, { useEffect, useState } from 'react';
import type { OrderRef } from '../../types/workflow';
import { apiRequest } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { OrderSelect } from '../forms/OrderSelect';
import { inputClass } from '../../utils/styles';

interface ArtworkUploadModalProps {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  order?: OrderRef | null;
}

export function ArtworkUploadModal({ open, onClose, onDone, order }: ArtworkUploadModalProps) {
  const [orderId, setOrderId] = useState<number | null>(order?.id ?? null);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [colors, setColors] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [placement, setPlacement] = useState('');
  const { run, pending, fieldErrors } = useAction();

  useEffect(() => {
    if (!open) return;
    setOrderId(order?.id ?? null);
    setTitle('');
    setFile(null);
    setColors('');
    setDimensions('');
    setPlacement('');
  }, [open, order]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !file) return;
    const fd = new FormData();
    fd.append('order', String(orderId));
    fd.append('title', title);
    fd.append('file', file);
    fd.append('color_codes', colors);
    fd.append('dimensions', dimensions);
    fd.append('placement', placement);
    const res = await run(() => apiRequest('/api/artworks/artworks/', { method: 'POST', body: fd }), 'Artwork uploaded as draft');
    if (res !== undefined) onDone();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload artwork"
      description={order ? `For ${order.order_id}` : 'Attach customer artwork to an order.'}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="artwork-form" loading={pending} disabled={!orderId || !file || !title.trim()}>
            Upload
          </Button>
        </>
      }>
      
      <form id="artwork-form" onSubmit={submit} className="space-y-4">
        {!order &&
        <Field label="Order" htmlFor="aw-order" required>
            <OrderSelect id="aw-order" value={orderId} onChange={(o) => setOrderId(o?.id ?? null)} />
          </Field>
        }
        <Field label="Title" htmlFor="aw-title" required error={fieldErrors.title}>
          <input id="aw-title" required className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Design file" htmlFor="aw-file" required error={fieldErrors.file}>
          <input id="aw-file" type="file" required className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-canvas file:px-3 file:py-2 file:text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Field>
        <Field label="Colour codes" htmlFor="aw-colors" hint="e.g. Pantone 299 C, Pure White">
          <input id="aw-colors" className={inputClass} value={colors} onChange={(e) => setColors(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Dimensions" htmlFor="aw-dim">
            <input id="aw-dim" className={inputClass} value={dimensions} onChange={(e) => setDimensions(e.target.value)} />
          </Field>
          <Field label="Placement" htmlFor="aw-place">
            <input id="aw-place" className={inputClass} placeholder="Center chest" value={placement} onChange={(e) => setPlacement(e.target.value)} />
          </Field>
        </div>
      </form>
    </Modal>);

}