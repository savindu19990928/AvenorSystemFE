import React, { useState } from 'react';
import { CheckCircle2Icon, ClockIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import type { OrderDetail } from '../../types/api';
import type { OrderCost, OrderResourceUsage } from '../../types/resources';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { useAction } from '../../hooks/useAction';
import { api } from '../../utils/api';
import { formatMoney, toNumber } from '../../utils/format';
import { formatQty } from '../../utils/resources';
import { Button } from '../ui/Button';
import { StateMessage } from '../ui/StateMessage';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { CostBreakdown } from '../costing/CostBreakdown';
import { AddOrderResourceModal } from '../resources/AddOrderResourceModal';

export function OrderMaterialsTab({ order, onChanged }: {order: OrderDetail;onChanged: () => void;}) {
  const { hasRole } = useAuth();
  const canSeeCost = hasRole('ADMIN', 'ACCOUNTS', 'SALES');
  const closed = order.status === 'CANCELLED' || order.status === 'ORDER_CLOSED';
  const canEdit = hasRole('ADMIN', 'SALES', 'STORE_KEEPER') && !closed;
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<OrderResourceUsage | null>(null);
  const { run, pending } = useAction();

  const usage = useApi(() => api.list<OrderResourceUsage>(`/api/orders/orders/${order.id}/resources/`), [order.id]);
  const cost = useApi(() => canSeeCost ? api.get<OrderCost>(`/api/orders/orders/${order.id}/manufacturing-cost/`) : Promise.resolve(null), [order.id]);

  const refresh = () => {
    usage.reload();
    cost.reload();
    onChanged();
  };

  const remove = async () => {
    if (!removing) return;
    const res = await run(
      async () => {
        await api.del(`/api/orders/orders/${order.id}/resources/${removing.id}/`);
        return true;
      },
      `${formatQty(removing.quantity_used, removing.unit_of_measurement)} returned to stock`
    );
    if (res !== undefined) {
      setRemoving(null);
      refresh();
    }
  };

  const itemName = (id: number | null) => id ? order.items.find((i) => i.id === id)?.product_name : null;
  const materialsTotal = (usage.data ?? []).reduce((s, u) => s + toNumber(u.total_cost), 0);

  return (
    <div className="divide-y divide-line">
      {canSeeCost &&
      <section className="p-5" aria-labelledby="order-cost-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="order-cost-title" className="text-sm font-semibold">Cost to make & profit</h2>
            {cost.data && (
          cost.data.is_manufacture_finished ?
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ok"><CheckCircle2Icon className="h-3.5 w-3.5" /> Manufacturing finished — final figures</span> :

          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted"><ClockIcon className="h-3.5 w-3.5" /> Still in production — figures update as costs are added</span>)
          }
          </div>
          {cost.loading && !cost.data ?
        <StateMessage kind="loading" title="Working out costs…" /> :
        cost.error || !cost.data ?
        <StateMessage kind="error" message={cost.error ?? 'No cost data'} onRetry={cost.reload} /> :

        <CostBreakdown cost={cost.data} showResources={false} />
        }
        </section>
      }

      <section className="p-5" aria-labelledby="order-materials-title">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="order-materials-title" className="text-sm font-semibold">Materials used</h2>
            <p className="text-xs text-muted">Fabric and other resources taken from stock for this order.</p>
          </div>
          {canEdit && <Button size="sm" icon={PlusIcon} onClick={() => setAdding(true)}>Add material</Button>}
        </div>
        {usage.loading && !usage.data ?
        <StateMessage kind="loading" /> :
        usage.error ?
        <StateMessage kind="error" message={usage.error} onRetry={usage.reload} /> :
        !usage.data || usage.data.length === 0 ?
        <StateMessage kind="empty" title="No materials recorded" message="Add the fabric (kg) and other resources this order uses so its true cost can be reported." /> :

        <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-canvas/60 text-xs text-faint">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Material</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Applies to</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Quantity</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Unit cost</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Cost</th>
                  {canEdit && <th scope="col" className="w-10 px-3 py-2"><span className="sr-only">Actions</span></th>}
                </tr>
              </thead>
              <tbody>
                {usage.data.map((u) =>
              <tr key={u.id} className="border-b border-line/70 last:border-0">
                    <td className="px-3 py-2.5">
                      <p className="font-medium">{u.resource_name}</p>
                      <p className="text-xs text-muted">{u.resource_type === 'FABRIC' ? 'Fabric' : 'Other resource'}{u.notes ? ` · ${u.notes}` : ''}</p>
                    </td>
                    <td className="px-3 py-2.5 text-muted">{itemName(u.order_item) ?? 'Whole order'}</td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums">{formatQty(u.quantity_used, u.unit_of_measurement)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted">{formatMoney(u.unit_cost)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(u.total_cost)}</td>
                    {canEdit &&
                <td className="px-3 py-2.5 text-right">
                        <Button variant="ghost" size="sm" icon={Trash2Icon} onClick={() => setRemoving(u)} aria-label={`Remove ${u.resource_name}`} />
                      </td>
                }
                  </tr>
              )}
              </tbody>
              <tfoot>
                <tr className="border-t border-line">
                  <td colSpan={4} className="px-3 py-2.5 text-right text-xs font-medium text-muted">Materials total</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatMoney(materialsTotal)}</td>
                  {canEdit && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        }
      </section>

      <AddOrderResourceModal
        order={order}
        open={adding}
        onClose={() => setAdding(false)}
        onDone={() => {
          setAdding(false);
          refresh();
        }} />
      
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        pending={pending}
        danger
        title={removing ? `Remove ${removing.resource_name}?` : 'Remove material'}
        message={removing ? `${formatQty(removing.quantity_used, removing.unit_of_measurement)} will be returned to material stock and removed from this order's cost.` : ''}
        confirmLabel="Remove material" />
      
    </div>);

}