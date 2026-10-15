import React, { useState } from 'react';
import { FactoryIcon } from 'lucide-react';
import type { OrderDetail, ProductionJob, ProductionStage } from '../../types/api';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { useAction } from '../../hooks/useAction';
import { useAuth } from '../../contexts/AuthContext';
import { processSummary, stageLabel } from '../../utils/production';
import { Button } from '../ui/Button';
import { StateMessage } from '../ui/StateMessage';
import { StatusBadge } from '../ui/StatusBadge';
import { StageTrack } from '../production/StageTrack';
import { StageActionModal } from '../workflow/StageActionModal';
import { AddWipToStageModal } from '../production/AddWipToStageModal';

export function OrderProductionTab({ order, onChanged }: {order: OrderDetail;onChanged: () => void;}) {
  const { hasRole } = useAuth();
  const canAct = hasRole('ADMIN', 'PRODUCTION');
  const [stage, setStage] = useState<{s: ProductionStage;next: ProductionStage | null;mode: 'start' | 'complete';} | null>(null);
  const [wipStage, setWipStage] = useState<ProductionStage | null>(null);
  const { run, pending } = useAction();
  const jobs = useApi(
    () => api.list<ProductionJob>('/api/production/production-jobs/', { order: order.id }).then((l) => l.find((j) => j.order === order.id || j.order_code === order.order_id) ?? null),
    [order.id]
  );
  const job = jobs.data ?? order.production_job ?? null;
  const hasApprovedArt = (order.artworks ?? []).some((a) => a.is_locked);
  const flow = processSummary(order.production_process_order);
  const startsLater = !!order.start_from_stage && order.production_process_order?.[0] !== order.start_from_stage;

  const refresh = () => {
    jobs.reload();
    onChanged();
  };

  const initialize = async () => {
    const res = await run(() => api.post('/api/production/production-jobs/initialize/', { order_id: order.order_id }), 'Production job created');
    if (res !== undefined) refresh();
  };

  if (jobs.loading && !job) return <StateMessage kind="loading" />;

  if (!job) {
    return (
      <StateMessage
        kind="empty"
        title="Production hasn't started"
        message={
        hasApprovedArt ?
        `Artwork is approved and locked. Create the job to open ${flow}.${startsLater ? ` Starts at ${stageLabel(order.start_from_stage)} using stored stock.` : ''}` :
        'Production uses the approved, locked artwork only. Approve artwork first.'
        }
        action={canAct && <Button variant="primary" icon={FactoryIcon} loading={pending} onClick={initialize}>Start production job</Button>} />);


  }

  return (
    <div className="p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Job #{job.id}</span>
        <StatusBadge status={job.status} />
        <span className="text-xs text-faint">{flow}</span>
      </div>
      <StageTrack
        stages={job.stages}
        canAct={canAct}
        onStart={(s) => setStage({ s, next: null, mode: 'start' })}
        onComplete={(s, next) => setStage({ s, next, mode: 'complete' })}
        onAddWip={setWipStage} />
      
      <AddWipToStageModal
        stage={wipStage}
        stages={job?.stages}
        orderCode={order.order_id}
        brandId={order.brand}
        brandName={order.brand_name}
        onClose={() => setWipStage(null)}
        onDone={() => {
          setWipStage(null);
          refresh();
        }} />
      
      <StageActionModal
        stage={stage?.s ?? null}
        next={stage?.next ?? null}
        mode={stage?.mode ?? 'start'}
        onClose={() => setStage(null)}
        onDone={() => {
          setStage(null);
          refresh();
        }} />
      
    </div>);

}