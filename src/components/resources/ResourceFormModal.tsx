import React, { useEffect, useState } from 'react';
import type { Resource, ResourceType } from '../../types/resources';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { useBrands } from '../../contexts/BrandContext';
import { FABRIC_UNIT } from '../../utils/resources';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { cx, inputClass } from '../../utils/styles';

interface ResourceFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (r: Resource) => void;
}

const TYPES: {value: ResourceType;label: string;hint: string;}[] = [
{ value: 'FABRIC', label: 'Fabric', hint: 'Always measured in kilograms' },
{ value: 'OTHER', label: 'Other resource', hint: 'Paints, inks, buttons, thread, trims…' }];


const UNIT_SUGGESTIONS = ['Liters', 'pieces', 'meters', 'rolls', 'boxes', 'spools'];

export function ResourceFormModal({ open, onClose, onCreated }: ResourceFormModalProps) {
  const { brands } = useBrands();
  const [type, setType] = useState<ResourceType>('FABRIC');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [brand, setBrand] = useState('');
  const [reorder, setReorder] = useState('');
  const [notes, setNotes] = useState('');
  const { run, pending, fieldErrors } = useAction();

  useEffect(() => {
    if (!open) return;
    setType('FABRIC');
    setName('');
    setUnit('');
    setBrand('');
    setReorder('');
    setNotes('');
  }, [open]);

  const valid = !!name.trim() && (type === 'FABRIC' || !!unit.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const created = await run(
      () =>
      api.post<Resource>('/api/inventory/resources/', {
        name: name.trim(),
        resource_type: type,
        ...(type === 'OTHER' ? { unit_of_measurement: unit.trim() } : {}),
        brand: brand ? Number(brand) : null,
        reorder_level: Number(reorder || 0).toFixed(2),
        notes: notes.trim()
      }),
      `${name.trim()} added`
    );
    if (created) onCreated(created);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New resource"
      description="Define a material once, then record purchases against it."
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="resource-form" loading={pending} disabled={!valid}>
            Add resource
          </Button>
        </>
      }>
      
      <form id="resource-form" onSubmit={submit} className="space-y-4">
        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-ink">Type</legend>
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
            {TYPES.map((t) =>
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={type === t.value}
              onClick={() => setType(t.value)}
              className={cx(
                'rounded-lg border px-3 py-2.5 text-left transition-colors duration-150',
                type === t.value ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'
              )}>
              
                <span className="block text-sm font-medium text-ink">{t.label}</span>
                <span className="block text-xs text-muted">{t.hint}</span>
              </button>
            )}
          </div>
        </fieldset>

        <Field label="Name" htmlFor="rs-name" required error={fieldErrors.name}>
          <input
            id="rs-name"
            className={inputClass}
            placeholder={type === 'FABRIC' ? 'Single Jersey 100% Cotton 180 GSM' : 'Plastisol White Ink'}
            value={name}
            onChange={(e) => setName(e.target.value)} />
          
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Unit of measurement"
            htmlFor="rs-unit"
            required
            error={fieldErrors.unit_of_measurement}
            hint={type === 'FABRIC' ? 'Fabric is always tracked in kg' : 'Type the unit you buy and use it in'}>
            
            {type === 'FABRIC' ?
            <input id="rs-unit" className={inputClass} value={FABRIC_UNIT} disabled /> :

            <>
                <input id="rs-unit" list="rs-unit-list" className={inputClass} placeholder="e.g. Liters" value={unit} onChange={(e) => setUnit(e.target.value)} />
                <datalist id="rs-unit-list">
                  {UNIT_SUGGESTIONS.map((u) =>
                <option key={u} value={u} />
                )}
                </datalist>
              </>
            }
          </Field>
          <Field label="Reorder level" htmlFor="rs-reorder" hint="Warn when stock falls to this amount">
            <div className="relative">
              <input id="rs-reorder" type="number" min={0} step="0.01" className={cx(inputClass, 'pr-16')} value={reorder} onChange={(e) => setReorder(e.target.value)} />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-faint">{type === 'FABRIC' ? FABRIC_UNIT : unit || 'units'}</span>
            </div>
          </Field>
        </div>

        <Field label="Brand" htmlFor="rs-brand" hint="Leave as shared if both brands use it">
          <select id="rs-brand" className={inputClass} value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">Shared by both brands</option>
            {brands.map((b) =>
            <option key={b.id} value={b.id}>{b.name}</option>
            )}
          </select>
        </Field>

        <Field label="Notes" htmlFor="rs-notes">
          <textarea id="rs-notes" rows={2} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Modal>);

}