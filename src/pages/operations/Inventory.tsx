import React, { useState } from 'react';
import { AlertTriangleIcon, PackagePlusIcon, BanIcon, ArrowRightIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBrands } from '../../contexts/BrandContext';
import { useApi } from '../../hooks/useApi';
import { api } from '../../utils/api';
import type { DamagedStock, InventoryItem, StockMovement, StockReservation, WipItem } from '../../types/api';
import { stageLabel, stagesAfter } from '../../utils/production';
import { WipAllocateModal } from '../../components/inventory/WipAllocateModal';
import { formatDateTime, formatMoney, formatNumber, humanize } from '../../utils/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BrandTag } from '../../components/ui/BrandTag';
import { Tabs } from '../../components/ui/Tabs';
import { StockAdjustModal } from '../../components/inventory/StockAdjustModal';
import { cx } from '../../utils/styles';

type Tab = 'stock' | 'wip' | 'reservations' | 'movements' | 'damaged';

export function InventoryPage() {
  const { hasRole } = useAuth();
  const { scope } = useBrands();
  const manage = hasRole('ADMIN', 'STORE_KEEPER');
  const [tab, setTab] = useState<Tab>('stock');
  const [lowOnly, setLowOnly] = useState(false);
  const [adjust, setAdjust] = useState<{item: InventoryItem;mode: 'receive' | 'damaged';} | null>(null);
  const [allocating, setAllocating] = useState<WipItem | null>(null);
  const canAllocate = hasRole('ADMIN', 'STORE_KEEPER', 'PRODUCTION');
  const wip = useApi(() => tab === 'wip' ? api.list<WipItem>('/api/inventory/wip/', { brand: scope }) : Promise.resolve(null), [tab, scope]);

  const items = useApi(() => api.list<InventoryItem>(lowOnly ? '/api/inventory/inventory-items/low-stock/' : '/api/inventory/inventory-items/', { brand: scope }), [scope, lowOnly]);
  const reservations = useApi(() => tab === 'reservations' ? api.list<StockReservation>('/api/inventory/reservations/') : Promise.resolve(null), [tab]);
  const movements = useApi(() => tab === 'movements' && manage ? api.list<StockMovement>('/api/inventory/movements/') : Promise.resolve(null), [tab]);
  const damaged = useApi(() => tab === 'damaged' && manage ? api.list<DamagedStock>('/api/inventory/damaged-stock/') : Promise.resolve(null), [tab]);

  const rows = items.data?.filter((i) => !scope || i.brand === scope) ?? null;
  const lowCount = items.data?.filter((i) => i.is_low_stock).length ?? 0;

  const tabs: {id: Tab;label: string;}[] = [
  { id: 'stock', label: 'Blank stock' },
  { id: 'wip', label: 'Semi-finished' },
  { id: 'reservations', label: 'Reservations' },
  ...(manage ? [{ id: 'movements', label: 'Movements' }, { id: 'damaged', label: 'Damaged' }] as {id: Tab;label: string;}[] : [])];


  return (
    <div>
      <PageHeader title="Inventory" description="Blank garments and stored semi-finished units by brand, colour, size and GSM. Confirmed orders reserve stock; cutting issues it to production." />
      <Panel flush>
        <div className="px-4 pt-1">
          <Tabs<Tab> tabs={tabs} active={tab} onChange={setTab} />
        </div>

        {tab === 'stock' &&
        <>
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
                <input type="checkbox" className="h-4 w-4 rounded border-line accent-[#1f6f5c]" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
                Low stock only
              </label>
              {!lowOnly && lowCount > 0 &&
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warn">
                  <AlertTriangleIcon className="h-3.5 w-3.5" /> {lowCount} below reorder level
                </span>
            }
            </div>
            <DataTable
            rows={rows}
            loading={items.loading}
            error={items.error}
            onRetry={items.reload}
            getRowKey={(i) => i.id}
            rowClassName={(i) => i.is_low_stock ? 'bg-warn-soft/40' : ''}
            emptyTitle={lowOnly ? 'No low-stock items' : 'No stock items'}
            columns={[
            {
              key: 'sku',
              header: 'Item',
              render: (i) =>
              <div>
                      <p className="font-medium">{i.product_name}</p>
                      <p className="font-mono text-xs text-muted">{i.sku}</p>
                    </div>

            },
            { key: 'brand', header: 'Brand', render: (i) => <BrandTag name={i.brand_name} /> },
            { key: 'spec', header: 'Colour / size', render: (i) => <span className="text-muted">{i.colour} · {i.size}{i.fabric_gsm ? ` · ${i.fabric_gsm}` : ''}</span> },
            { key: 'hand', header: 'On hand', align: 'right', render: (i) => formatNumber(i.quantity_on_hand) },
            { key: 'res', header: 'Reserved', align: 'right', render: (i) => <span className="text-muted">{formatNumber(i.reserved_quantity)}</span> },
            {
              key: 'avail',
              header: 'Available',
              align: 'right',
              render: (i) =>
              <span className={cx('font-semibold', i.is_low_stock && 'text-warn')}>
                      {formatNumber(i.available_quantity)}
                      <span className="block text-[11px] font-normal text-faint">min {i.reorder_level}</span>
                    </span>

            },
            { key: 'cost', header: 'Unit cost', align: 'right', render: (i) => <span className="text-muted">{formatMoney(i.unit_cost)}</span> },
            ...(manage ?
            [
            {
              key: 'act',
              header: '',
              align: 'right' as const,
              render: (i: InventoryItem) =>
              <div className="flex justify-end gap-1">
                            <Button size="sm" icon={PackagePlusIcon} onClick={() => setAdjust({ item: i, mode: 'receive' })}>Receive</Button>
                            <Button size="sm" variant="ghost" icon={BanIcon} onClick={() => setAdjust({ item: i, mode: 'damaged' })} aria-label="Report damaged" />
                          </div>

            }] :

            [])]
            } />
          
          </>
        }

        {tab === 'wip' &&
        <>
            <p className="border-b border-line px-4 py-3 text-sm text-muted">
              Extra units stored after a production step. Use them in an order to skip the steps already done.
            </p>
            <DataTable
            rows={wip.data?.filter((w) => !scope || w.brand === scope) ?? null}
            loading={wip.loading}
            error={wip.error}
            onRetry={wip.reload}
            getRowKey={(w) => w.id}
            emptyTitle="No semi-finished stock"
            columns={[
            {
              key: 'sku',
              header: 'Item',
              render: (w) =>
              <div>
                      <p className="font-medium">{w.product_name}</p>
                      <p className="font-mono text-xs text-muted">{w.sku}</p>
                    </div>

            },
            { key: 'brand', header: 'Brand', render: (w) => <BrandTag name={w.brand_name} /> },
            { key: 'spec', header: 'Colour / size', render: (w) => <span className="text-muted">{w.colour} · {w.size}{w.fabric_gsm ? ` · ${w.fabric_gsm}` : ''}</span> },
            {
              key: 'stage',
              header: 'Finished step',
              render: (w) => {
                const next = stagesAfter(w.stage_completed)[0];
                return (
                  <div>
                        <p className="font-medium">{w.stage_completed_display ?? stageLabel(w.stage_completed)}</p>
                        <p className="text-xs text-muted">{next ? `Can start from ${stageLabel(next)}` : 'Finished goods'}</p>
                      </div>);

              }
            },
            { key: 'src', header: 'From order', render: (w) => <span className="font-mono text-xs text-muted">{w.source_order_code || '—'}</span> },
            { key: 'hand', header: 'On hand', align: 'right', render: (w) => formatNumber(w.quantity_on_hand) },
            { key: 'res', header: 'Reserved', align: 'right', render: (w) => <span className="text-muted">{formatNumber(w.reserved_quantity)}</span> },
            { key: 'avail', header: 'Available', align: 'right', render: (w) => <span className="font-semibold">{formatNumber(w.available_quantity)}</span> },
            ...(canAllocate ?
            [
            {
              key: 'act',
              header: '',
              align: 'right' as const,
              render: (w: WipItem) =>
              <Button size="sm" icon={ArrowRightIcon} disabled={w.available_quantity <= 0} onClick={() => setAllocating(w)}>
                            Use in order
                          </Button>

            }] :

            [])]
            } />
          
          </>
        }

        {tab === 'reservations' &&
        <DataTable
          rows={reservations.data}
          loading={reservations.loading}
          error={reservations.error}
          onRetry={reservations.reload}
          getRowKey={(r) => r.id}
          emptyTitle="No reservations"
          columns={[
          { key: 'order', header: 'Order', render: (r) => <span className="font-mono text-xs font-medium">{r.order_id_code}</span> },
          { key: 'sku', header: 'SKU', render: (r) => <span className="font-mono text-xs">{r.inventory_sku}</span> },
          { key: 'qty', header: 'Quantity', align: 'right', render: (r) => formatNumber(r.quantity) },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'when', header: 'Created', render: (r) => <span className="text-muted">{formatDateTime(r.created_at)}</span> }]
          } />

        }

        {tab === 'movements' &&
        <DataTable
          rows={movements.data}
          loading={movements.loading}
          error={movements.error}
          onRetry={movements.reload}
          getRowKey={(m) => m.id}
          emptyTitle="No stock movements"
          columns={[
          { key: 'when', header: 'When', render: (m) => <span className="whitespace-nowrap text-muted">{formatDateTime(m.timestamp)}</span> },
          { key: 'type', header: 'Movement', render: (m) => <StatusBadge status={m.movement_type} label={m.movement_type_display ?? humanize(m.movement_type)} /> },
          { key: 'sku', header: 'SKU', render: (m) => <span className="font-mono text-xs">{m.inventory_sku}</span> },
          { key: 'qty', header: 'Qty', align: 'right', render: (m) => formatNumber(m.quantity) },
          { key: 'ref', header: 'Reference', render: (m) => <span className="text-muted">{m.reference || '—'}</span> },
          { key: 'by', header: 'By', render: (m) => <span className="text-muted">{m.logged_by_name}</span> }]
          } />

        }

        {tab === 'damaged' &&
        <DataTable
          rows={damaged.data}
          loading={damaged.loading}
          error={damaged.error}
          onRetry={damaged.reload}
          getRowKey={(d) => d.id}
          emptyTitle="No damaged stock recorded"
          columns={[
          { key: 'when', header: 'When', render: (d) => <span className="whitespace-nowrap text-muted">{formatDateTime(d.created_at)}</span> },
          { key: 'sku', header: 'SKU', render: (d) => <span className="font-mono text-xs">{d.inventory_sku}</span> },
          { key: 'brand', header: 'Brand', render: (d) => <BrandTag name={d.brand_name} /> },
          { key: 'qty', header: 'Qty', align: 'right', render: (d) => <span className="text-danger">{formatNumber(d.quantity)}</span> },
          { key: 'reason', header: 'Reason', render: (d) => <span className="text-muted">{d.reason}</span> },
          { key: 'by', header: 'Logged by', render: (d) => <span className="text-muted">{d.logged_by_name}</span> }]
          } />

        }
      </Panel>
      <StockAdjustModal
        item={adjust?.item ?? null}
        mode={adjust?.mode ?? 'receive'}
        onClose={() => setAdjust(null)}
        onDone={() => {
          setAdjust(null);
          items.reload();
        }} />
      
      <WipAllocateModal
        item={allocating}
        onClose={() => setAllocating(null)}
        onDone={() => {
          setAllocating(null);
          wip.reload();
        }} />
      
    </div>);

}