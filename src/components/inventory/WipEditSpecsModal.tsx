import React, { useState } from 'react';
import type { WipItem } from '../../types/api';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { formatNumber } from '../../utils/format';
import { stageLabel } from '../../utils/production';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { SizeToggleGroup } from '../forms/SizeToggleGroup';
import { ColourTagsInput } from '../forms/ColourTagsInput';
import { inputClass } from '../../utils/styles';
import { SparklesIcon } from 'lucide-react';

interface WipEditSpecsModalProps {
  item: WipItem | null;
  onClose: () => void;
  onDone: () => void;
}

function WipEditSpecsModalContent({ item, onClose, onDone }: { item: WipItem; onClose: () => void; onDone: () => void }) {
  const [sizes, setSizes] = useState<string[]>(() =>
    item.sizes && item.sizes.length
      ? item.sizes
      : item.size
      ? item.size.split(',').map((s) => s.trim()).filter(Boolean)
      : []
  );
  const [colours, setColours] = useState<string[]>(() =>
    item.colours && item.colours.length
      ? item.colours
      : item.colour
      ? item.colour.split(',').map((c) => c.trim()).filter(Boolean)
      : []
  );
  const [fabricGsm, setFabricGsm] = useState(() => item.fabric_gsm ?? '');
  const [printingMethod, setPrintingMethod] = useState(() => item.printing_method ?? '');
  const [notes, setNotes] = useState(() => item.notes ?? '');
  const { run, pending } = useAction();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      colours,
      colors: colours,
      colour: colours.join(', '),
      sizes,
      size: sizes.join(', '),
      fabric_gsm: fabricGsm.trim() || undefined,
      printing_method: printingMethod.trim() || undefined,
      notes: notes.trim() || undefined
    };

    const res = await run(
      () => api.patch<WipItem>(`/api/inventory/wip/${item.id}/`, payload),
      `Updated specifications for ${item.stock_id || item.sku}`
    );
    if (res !== undefined) onDone();
  };

  const autoId = item.stock_id || item.wip_id || 'Auto-generated ID';

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`Specifications · ${autoId}`}
      description="Update or populate specifications (colours, sizes, fabric GSM, and printing method) matching quotation item standards. All specification fields are optional and can be updated anytime."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="wip-specs-form" loading={pending}>
            Save Specifications
          </Button>
        </>
      }
    >
      <form id="wip-specs-form" onSubmit={submit} className="space-y-4">
        <div className="rounded-lg border border-line bg-canvas/60 p-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 font-mono">
            <span className="font-semibold text-accent">{autoId}</span>
            <span className="text-faint">{item.sku}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 text-muted">
            <div>
              <span className="block text-[11px] text-faint">Product</span>
              <span className="font-medium text-ink">{item.product_name}</span>
            </div>
            <div>
              <span className="block text-[11px] text-faint">Brand</span>
              <span className="font-medium text-ink">{item.brand_name}</span>
            </div>
            <div>
              <span className="block text-[11px] text-faint">Finished Stage</span>
              <span className="font-medium text-ink">{item.stage_completed_display ?? stageLabel(item.stage_completed)}</span>
            </div>
            <div>
              <span className="block text-[11px] text-faint">Available Units</span>
              <span className="font-semibold tabular-nums text-ink">{formatNumber(item.available_quantity)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label id="wip-sizes-label" className="text-xs font-medium text-ink">
                Sizes <span className="text-[11px] font-normal text-muted">(Optional)</span>
              </label>
              {sizes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSizes([])}
                  className="text-[11px] text-faint hover:text-danger"
                >
                  Clear all
                </button>
              )}
            </div>
            <SizeToggleGroup labelId="wip-sizes-label" value={sizes} onChange={setSizes} />
            <p className="mt-1 text-[11px] text-muted">Select applicable sizes for this semi-finished stock batch.</p>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="wip-colours-input" className="text-xs font-medium text-ink">
                Colours <span className="text-[11px] font-normal text-muted">(Optional)</span>
              </label>
            </div>
            <ColourTagsInput id="wip-colours-input" value={colours} onChange={setColours} />
            <p className="mt-1 text-[11px] text-muted">Type colour names and press Enter or comma (e.g. Navy Blue, Black).</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Fabric GSM"
              htmlFor="wip-gsm"
              hint="Optional (e.g. 220 GSM, 240 GSM)"
            >
              <input
                id="wip-gsm"
                type="text"
                className={inputClass}
                placeholder="e.g. 220 GSM"
                value={fabricGsm}
                onChange={(e) => setFabricGsm(e.target.value)}
              />
            </Field>

            <Field
              label="Printing Method"
              htmlFor="wip-print-method"
              hint="Optional (e.g. Screen Printing, DTF)"
            >
              <input
                id="wip-print-method"
                type="text"
                className={inputClass}
                placeholder="e.g. Screen Printing, DTF"
                value={printingMethod}
                onChange={(e) => setPrintingMethod(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Notes & Rationale" htmlFor="wip-notes" hint="Optional notes about quality or specifications">
            <textarea
              id="wip-notes"
              rows={2}
              maxLength={255}
              className={inputClass}
              placeholder="e.g. Added specification details after QC inspection"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>

        <div className="rounded-lg bg-info-soft/40 p-2.5 text-xs text-info flex items-start gap-2">
          <SparklesIcon className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Specifications match the <strong>Quotation Item standard</strong>. Leaving any fields blank is fully supported — specifications can be enriched at any stage of production or inventory hold.
          </span>
        </div>
      </form>
    </Modal>
  );
}

export function WipEditSpecsModal(props: WipEditSpecsModalProps) {
  if (!props.item) return null;
  return <WipEditSpecsModalContent key={props.item.id} {...props} item={props.item} />;
}
