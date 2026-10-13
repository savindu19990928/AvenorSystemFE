import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FactoryIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBrands } from '../../contexts/BrandContext';
import { useApi } from '../../hooks/useApi';
import { useAction } from '../../hooks/useAction';
import { api } from '../../utils/api';
import type { Order, ProductionJob, ProductionStage } from '../../types/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Field } from '../../components/ui/Field';
import { StateMessage } from '../../components/ui/StateMessage';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BrandTag } from '../../components/ui/BrandTag';
import { Tabs } from '../../components/ui/Tabs';
import { OrderSelect } from '../../components/forms/OrderSelect';
import { StageTrack } from '../../components/production/StageTrack';
import { StageActionModal } from '../../components/workflow/StageActionModal';
import { AddWipToStageModal } from '../../components/production/AddWipToStageModal';

type Filter = 'active' | 'COMPLETED' | 'all';

export function ProductionPage() {
  const { hasRole } = useAuth();
  const { scopedBrand } = useBrands();
  const canAct = hasRole('ADMIN', 'PRODUCTION');
  const [filter, setFilter] = useState<Filter>('active');
  const [initOpen, setInitOpen] = useState(false);
  const [initOrder, setInitOrder] = useState<Order | null>(null);
  const [stage, setStage] = useState<{s: ProductionStage;next: ProductionStage | null;mode: 'start' | 'complete';} | null>(null);
  const [wip, setWip] = useState<{s: ProductionStage;job: ProductionJob;} | null>(null);
  const { run, pending } = useAction();
  const { data, loading, error, reload } = useApi(() => api.list<ProductionJob>('/api/production/production-jobs/'), []);

  const jobs = (data ?? []).
  filter((j) => !scopedBrand || j.brand_name === scopedBrand.name).
  filter((j) => filter === 'all' ? true : filter === 'COMPLETED' ? j.status === 'COMPLETED' : j.status !== 'COMPLETED');

  const initialize = async () => {
    if (!initOrder) return;
    const res = await run(() => api.post('/api/production/production-jobs/initialize/', { order_id: initOrder.order_id }), 'Production job created');
    if (res !== undefined) {
      setInitOpen(false);
      setInitOrder(null);
      reload();
    }
  };

  return (
    <div>
      <PageHeader
        title="Production floor"
        description="Each job follows the process order set on its order — any mix of cutting, printing, embroidery, sewing, finishing and packing. Extra output can be stored for future orders."
        actions={canAct && <Button variant="primary" icon={FactoryIcon} onClick={() => setInitOpen(true)}>Start job</Button>} />
      
      <div className="mb-4">
        <Tabs<Filter> tabs={[{ id: 'active', label: 'In progress' }, { id: 'COMPLETED', label: 'Completed' }, { id: 'all', label: 'All' }]} active={filter} onChange={setFilter} />
      </div>
      {loading && !data ?
      <StateMessage kind="loading" /> :
      error ?
      <StateMessage kind="error" message={error} onRetry={reload} /> :
      jobs.length === 0 ?
      <Panel><StateMessage kind="empty" title="No production jobs here" message="Jobs start once artwork is approved and locked." /></Panel> :

      <div className="space-y-4">
          {jobs.map((j) =>
        <Panel
          key={j.id}
          title={j.order_code ?? `Job #${j.id}`}
          actions={
          <div className="flex items-center gap-2">
                  <BrandTag name={j.brand_name} />
                  <StatusBadge status={j.status} />
                  {j.order && <Link to={`/orders/${j.order}`} className="text-xs font-medium text-accent hover:underline">Open order</Link>}
                </div>
          }>
          
              <StageTrack
            stages={j.stages}
            canAct={canAct}
            onStart={(s) => setStage({ s, next: null, mode: 'start' })}
            onComplete={(s, next) => setStage({ s, next, mode: 'complete' })}
            onAddWip={(s) => setWip({ s, job: j })} />
          
            </Panel>
        )}
        </div>
      }

      <Modal
        open={initOpen}
        onClose={() => setInitOpen(false)}
        title="Start production job"
        description="Creates the steps configured on the order, in its process order."
        footer={
        <>
            <Button onClick={() => setInitOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={pending} disabled={!initOrder} onClick={initialize}>Create job</Button>
          </>
        }>
        
        <Field label="Order with approved artwork" htmlFor="pj-order" required>
          <OrderSelect id="pj-order" status="ARTWORK_APPROVED" value={initOrder?.id ?? null} onChange={setInitOrder} />
        </Field>
      </Modal>
      <AddWipToStageModal
        stage={wip?.s ?? null}
        orderCode={wip?.job.order_code}
        brandName={wip?.job.brand_name}
        onClose={() => setWip(null)}
        onDone={() => {setWip(null);reload();}} />
      
      <StageActionModal stage={stage?.s ?? null} next={stage?.next ?? null} mode={stage?.mode ?? 'start'} onClose={() => setStage(null)} onDone={() => {setStage(null);reload();}} />
    </div>);

}