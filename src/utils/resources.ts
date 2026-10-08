import type { DraftResourceUsage, Resource, ResourceType } from '../types/resources';
import { toNumber } from './format';

export const FABRIC_UNIT = 'kg';

export const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  FABRIC: 'Fabric',
  OTHER: 'Other resource'
};

/** Quantity with its unit, e.g. "20 kg" or "200 pieces". Keeps up to 2 decimals. */
export function formatQty(value: string | number | null | undefined, unit?: string): string {
  const n = new Intl.NumberFormat('en-LK', { maximumFractionDigits: 2 }).format(toNumber(value));
  return unit ? `${n} ${unit}` : n;
}

export function isLowResource(r: Pick<Resource, 'current_stock_quantity' | 'reorder_level'>): boolean {
  return toNumber(r.current_stock_quantity) <= toNumber(r.reorder_level);
}

export function newDraftResource(): DraftResourceUsage {
  return { key: Math.random().toString(36).slice(2), resource_id: null, quantity_used: '', notes: '' };
}

/** Empty rows are ignored; a started row needs a resource and a positive quantity. */
export function isDraftResourceEmpty(d: DraftResourceUsage): boolean {
  return !d.resource_id && !d.quantity_used && !d.notes.trim();
}

export function isDraftResourceValid(d: DraftResourceUsage): boolean {
  return isDraftResourceEmpty(d) || !!d.resource_id && toNumber(d.quantity_used) > 0;
}

export function toResourcePayload(list: DraftResourceUsage[]) {
  return list.
  filter((d) => !isDraftResourceEmpty(d)).
  map((d) => ({
    resource_id: d.resource_id,
    quantity_used: toNumber(d.quantity_used).toFixed(2),
    ...(d.notes.trim() ? { notes: d.notes.trim() } : {})
  }));
}

/** Estimated cost of drafted materials using each resource's latest purchase cost. */
export function draftResourcesCost(list: DraftResourceUsage[], resources: Resource[]): number {
  return list.reduce((sum, d) => {
    const r = resources.find((x) => x.id === d.resource_id);
    return r ? sum + toNumber(d.quantity_used) * toNumber(r.unit_cost) : sum;
  }, 0);
}

/** Resources usable by a brand: shared (no brand) or tied to that brand. */
export function resourcesForBrand(list: Resource[], brandId: number | null | undefined): Resource[] {
  return list.filter((r) => r.is_active && (r.brand === null || !brandId || r.brand === brandId));
}

export function marginTone(percent: number): string {
  if (percent < 0) return 'text-danger';
  if (percent < 15) return 'text-warn';
  return 'text-ok';
}