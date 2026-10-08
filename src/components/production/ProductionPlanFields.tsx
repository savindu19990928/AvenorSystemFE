import React from 'react';
import type { ProcessConfig, WipAllocations } from '../../types/production';
import { ProcessOrderEditor } from './ProcessOrderEditor';
import { WipAllocationPicker } from './WipAllocationPicker';

interface ProductionPlanFieldsProps {
  brandId: number | null | undefined;
  config: ProcessConfig;
  onConfigChange: (value: ProcessConfig) => void;
  allocations: WipAllocations;
  onAllocationsChange: (value: WipAllocations) => void;
  idPrefix?: string;
}

/** Process order + optional stored-stock start, shared by every flow that creates an order. */
export function ProductionPlanFields({ brandId, config, onConfigChange, allocations, onAllocationsChange, idPrefix }: ProductionPlanFieldsProps) {
  return (
    <div className="space-y-3">
      <ProcessOrderEditor
        idPrefix={idPrefix}
        value={config}
        onChange={(next) => {
          if (next.startFrom !== config.startFrom || next.order.join() !== config.order.join()) onAllocationsChange({});
          onConfigChange(next);
        }} />
      
      <WipAllocationPicker brandId={brandId} config={config} value={allocations} onChange={onAllocationsChange} />
    </div>);

}