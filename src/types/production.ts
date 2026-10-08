import type { StageName } from './api';

/** Which production steps an order runs, in what order, and where it begins. */
export interface ProcessConfig {
  order: StageName[];
  startFrom: StageName;
}

/** Stored semi-finished stock picked for an order: WIP item id → quantity (as typed). */
export type WipAllocations = Record<number, string>;