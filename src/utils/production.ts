import type { StageName } from '../types/api';
import type { ProcessConfig, WipAllocations } from '../types/production';
import { DEFAULT_PROCESS_ORDER, PRODUCTION_STAGES } from '../data/workflow';
import { api } from './api';
import { humanize } from './format';

export function stageLabel(name?: string | null): string {
  return PRODUCTION_STAGES.find((s) => s.value === name)?.label ?? humanize(name ?? '');
}

export function defaultProcess(): ProcessConfig {
  return { order: [...DEFAULT_PROCESS_ORDER], startFrom: DEFAULT_PROCESS_ORDER[0] };
}

/** The step whose finished stock can be used to begin at `startFrom`. Null when starting at the first step. */
export function stageBefore(config: ProcessConfig): StageName | null {
  const idx = config.order.indexOf(config.startFrom);
  return idx > 0 ? config.order[idx - 1] : null;
}

/** Steps that come after a given step in the standard sequence — where stored stock can re-enter production. */
export function stagesAfter(stage: StageName): StageName[] {
  const idx = DEFAULT_PROCESS_ORDER.indexOf(stage);
  return idx === -1 ? [] : DEFAULT_PROCESS_ORDER.slice(idx + 1);
}

/** Steps that come before a given step in the standard sequence — stock finished at these can be added to it. */
export function stagesBefore(stage: string): StageName[] {
  const idx = DEFAULT_PROCESS_ORDER.indexOf(stage as StageName);
  return idx <= 0 ? [] : DEFAULT_PROCESS_ORDER.slice(0, idx);
}

/** Net semi-finished pieces a step sends to inventory: extra pieces minus damaged pieces, never below zero. */
export function semiFinishedCount(extra: number, damaged: number): number {
  return Math.max(0, extra - damaged);
}

export function processPayload(config: ProcessConfig) {
  return { production_process_order: config.order, start_from_stage: config.startFrom };
}

export function processSummary(order?: StageName[] | null): string {
  return (order?.length ? order : DEFAULT_PROCESS_ORDER).map(stageLabel).join(' → ');
}

/** Reserves the picked stored stock for a newly created order so it can start mid-process. */
export async function allocateWip(orderCode: string, config: ProcessConfig, allocations: WipAllocations): Promise<void> {
  if (!stageBefore(config)) return;
  const picks = Object.entries(allocations).filter(([, qty]) => Number(qty) > 0);
  for (const [id, qty] of picks) {
    await api.post(`/api/inventory/wip/${id}/allocate-to-order/`, {
      order_id: orderCode,
      quantity: Number(qty),
      target_stage: config.startFrom,
      notes: `Used to start ${orderCode} at ${stageLabel(config.startFrom)}`
    });
  }
}