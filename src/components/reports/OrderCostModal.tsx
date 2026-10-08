import React from 'react';
import { CheckCircle2Icon, ClockIcon } from 'lucide-react';
import type { OrderCostBreakdown } from '../../types/resources';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { formatDate, formatMoney, toNumber } from '../../utils/format';
import { orderCostSpec } from '../../utils/costingReports';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StateMessage } from '../ui/StateMessage';
import { StatusBadge } from '../ui/StatusBadge';
import { BrandTag } from '../ui/BrandTag';
import { CostBreakdown } from '../costing/CostBreakdown';
import { ReportExportActions } from '../print/ReportExportActions';

export function OrderCostModal({ orderCode, onClose }: {orderCode: string | null;onClose: () => void;}) {
  const { data, loading, error, reload } = useApi(
    () => orderCode ? api.get<OrderCostBreakdown>(`/api/reports/orders/${encodeURIComponent(orderCode)}/cost-breakdown/`) : Promise.resolve(null),
    [orderCode]
  );
  const current = data && data.order_id === orderCode ? data : null;
  const billing = current?.billing_status;

  return (
    <Modal
      open={!!orderCode}
      onClose={onClose}
      size="xl"
      title={orderCode ? `Cost breakdown · ${orderCode}` : 'Cost breakdown'}
      description={current ? `${current.customer} · created ${formatDate(current.created_at)}` : undefined}
      footer={
      <>
          {current && <ReportExportActions spec={orderCostSpec(current)} />}
          <Button variant="primary" onClick={onClose}>Done</Button>
        </>
      }>
      
      {loading && !current ?
      <StateMessage kind="loading" title="Loading cost breakdown…" /> :
      error || !current ?
      <StateMessage kind="error" message={error ?? 'No cost data for this order'} onRetry={reload} /> :

      <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <BrandTag name={current.brand} />
            <StatusBadge status={current.status} />
            {current.is_manufacture_finished ?
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ok"><CheckCircle2Icon className="h-3.5 w-3.5" /> Manufacturing finished</span> :

          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted"><ClockIcon className="h-3.5 w-3.5" /> Still in production</span>
          }
            {billing &&
          <span className="ml-auto text-xs text-muted">
                Paid <span className="tabular-nums text-ink">{formatMoney(billing.paid_amount)}</span> of {formatMoney(billing.total_amount)}
                {toNumber(billing.balance_amount) > 0 && <span className="ml-2 font-medium text-danger">Balance {formatMoney(billing.balance_amount)}</span>}
              </span>
          }
          </div>
          <CostBreakdown cost={current} />
        </div>
      }
    </Modal>);

}