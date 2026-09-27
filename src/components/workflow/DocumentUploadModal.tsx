import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { DOCUMENT_TYPES } from '../../data/workflow';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { inputClass } from '../../utils/styles';

export function DocumentUploadModal({ open, onClose, onDone, orderId, orderCode }: {open: boolean;onClose: () => void;onDone: () => void;orderId: number;orderCode: string;}) {
  const [type, setType] = useState('PURCHASE_ORDER');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const { run, pending } = useAction();

  useEffect(() => {
    if (!open) return;
    setType('PURCHASE_ORDER');
    setTitle('');
    setFile(null);
    setNotes('');
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append('document_type', type);
    fd.append('title', title || file.name);
    fd.append('file', file);
    fd.append('notes', notes);
    const res = await run(() => apiRequest(`/api/orders/orders/${orderId}/upload-document/`, { method: 'POST', body: fd }), 'Document attached');
    if (res !== undefined) onDone();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attach document"
      description={`Filed under ${orderCode}`}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="doc-form" loading={pending} disabled={!file}>
            Attach
          </Button>
        </>
      }>
      
      <form id="doc-form" onSubmit={submit} className="space-y-4">
        <Field label="Document type" htmlFor="doc-type" required>
          <select id="doc-type" className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
            {DOCUMENT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </Field>
        <Field label="Title" htmlFor="doc-title">
          <input id="doc-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="File" htmlFor="doc-file" required>
          <input id="doc-file" type="file" required className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-canvas file:px-3 file:py-2 file:text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Field>
        <Field label="Notes" htmlFor="doc-notes">
          <textarea id="doc-notes" rows={2} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Modal>);

}