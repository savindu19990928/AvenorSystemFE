import React, { useMemo, useState } from 'react';
import { AlertTriangleIcon, PlusIcon, ReceiptIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBrands } from '../../contexts/BrandContext';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { api } from '../../utils/api';
import type { Resource, ResourcePurchase, ResourceType } from '../../types/resources';
import { formatDate, formatMoney, toNumber } from '../../utils/format';
import { formatQty, isLowResource } from '../../utils/resources';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { BrandTag } from '../../components/ui/BrandTag';
import { Tabs } from '../../components/ui/Tabs';
import { SearchInput } from '../../components/ui/SearchInput';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { ResourceFormModal } from '../../components/resources/ResourceFormModal';
import { ResourcePurchaseModal } from '../../components/resources/ResourcePurchaseModal';
import { cx } from '../../utils/styles';

type Tab = 'stock' | 'purchases';
type TypeFilter = 'ALL' | ResourceType;

const TYPE_OPTIONS: {value: TypeFilter;label: string;}[] = [
{ value: 'ALL', label: 'All' },
{ value: 'FABRIC', label: 'Fabrics (kg)' },
{ value: 'OTHER', label: 'Other resources' }];


export function MaterialsPage() {
  const { hasRole } = useAuth();
  const { scope } = useBrands();
  const canDefine = hasRole('ADMIN', 'STORE_KEEPER');
  const canPurchase = hasRole('ADMIN', 'STORE_KEEPER', 'ACCOUNTS');
  const [tab, setTab] = useState<Tab>('stock');
  const [type, setType] = useState<TypeFilter>('ALL');
  const [search, setSearch] = useState('');
  const q = useDebounce(search);
  const [creating, setCreating] = useState(false);
  const [purchaseFor, setPurchaseFor] = useState<{id: number | null;} | null>(null);

  const resources = useApi(
    () => api.list<Resource>('/api/inventory/resources/', { resource_type: type === 'ALL' ? undefined : type, search: q }),
    [type, q]
  );
  const allResources = useApi(() => api.list<Resource>('/api/inventory/resources/', { is_active: true }), []);
  const purchases = useApi(
    () => tab === 'purchases' && canPurchase ? api.list<ResourcePurchase>('/api/inventory/resource-purchases/') : Promise.resolve(null),
    [tab]
  );

  const rows = resources.data?.filter((r) => !scope || r.brand === null || r.brand === scope) ?? null;
  const lowCount = rows?.filter(isLowResource).length ?? 0;
  const stockValue = useMemo(() => (rows ?? []).reduce((s, r) => s + toNumber(r.current_stock_quantity) * toNumber(r.unit_cost), 0), [rows]);

  const purchaseRows = purchases.data?.filter((p) => type === 'ALL' || p.resource_type === type) ?? null;
  const purchaseTotal = (purchaseRows ?? []).reduce((s, p) => s + toNumber(p.total_cost), 0);

  const tabs: {id: Tab;label: string;}[] = [
  { id: 'stock', label: 'Material stock' },
  ...(canPurchase ? [{ id: 'purchases' as Tab, label: 'Purchases (expenses)' }] : [])];


  const reloadAll = () => {
    resources.reload();
    allResources.reload();
    purchases.reload();
  };

  return (
    <div>
      <PageHeader
        title="Materials"
        description="Fabrics (by kg) and other resources like paints, buttons and thread. Purchases are recorded as expenses; orders draw from this stock."
        actions={
        <>
            {canDefine && <Button icon={PlusIcon} onClick={() => setCreating(true)}>New resource</Button>}
            {canPurchase && <Button variant="primary" icon={ReceiptIcon} onClick={() => setPurchaseFor({ id: null })}>Record purchase</Button>}
          </>
        } />
      
      <Panel flush>
        <div className="px-4 pt-1">
          <Tabs<Tab> tabs={tabs} active={tab} onChange={setTab} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl label="Resource type" options={TYPE_OPTIONS} value={type} onChange={setType} />
            {tab === 'stock' && <SearchInput value={search} onChange={setSearch} placeholder="Search materials" className="w-56" />}
          </div>
          {tab === 'stock' ?
          <div className="flex items-center gap-4 text-xs text-muted">
              {lowCount > 0 &&
            <span className="inline-flex items-center gap-1.5 font-medium text-warn">
                  <AlertTriangleIcon className="h-3.5 w-3.5" /> {lowCount} at or below reorder level
                </span>
            }
              <span>Stock value <span className="font-semibold tabular-nums text-ink">{formatMoney(stockValue)}</span></span>
            </div> :

          <span className="text-xs text-muted">Total spent <span className="font-semibold tabular-nums text-ink">{formatMoney(purchaseTotal)}</span></span>
          }
        </div>

        {tab === 'stock' &&
        <DataTable
          rows={rows}
          loading={resources.loading}
          error={resources.error}
          onRetry={resources.reload}
          getRowKey={(r) => r.id}
          rowClassName={(r) => isLowResource(r) ? 'bg-warn-soft/40' : ''}
          emptyTitle="No materials yet"
          emptyMessage={canDefine ? 'Add fabrics and other resources so purchases and order usage can be tracked.' : undefined}
          emptyAction={canDefine ? <Button size="sm" icon={PlusIcon} onClick={() => setCreating(true)}>New resource</Button> : undefined}
          columns={[
          {
            key: 'name',
            header: 'Material',
            render: (r) =>
            <div className="min-w-0">
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted">{r.resource_type === 'FABRIC' ? 'Fabric' : 'Other resource'}{r.notes ? ` · ${r.notes}` : ''}</p>
                  </div>

          },
          { key: 'brand', header: 'Brand', render: (r) => r.brand_name ? <BrandTag name={r.brand_name} /> : <span className="text-xs text-muted">Shared</span> },
          {
            key: 'stock',
            header: 'In stock',
            align: 'right',
            render: (r) =>
            <span className={cx('font-semibold', isLowResource(r) && 'text-warn')}>
                    {formatQty(r.current_stock_quantity, r.unit_of_measurement)}
                    <span className="block text-[11px] font-normal text-faint">min {formatQty(r.reorder_level)}</span>
                  </span>

          },
          { key: 'cost', header: 'Latest cost', align: 'right', render: (r) => <span className="text-muted">{formatMoney(r.unit_cost)} / {r.unit_of_measurement}</span> },
          { key: 'value', header: 'Stock value', align: 'right', render: (r) => formatMoney(toNumber(r.current_stock_quantity) * toNumber(r.unit_cost)) },
          ...(canPurchase ?
          [
          {
            key: 'act',
            header: '',
            align: 'right' as const,
            render: (r: Resource) =>
            <Button size="sm" icon={ReceiptIcon} onClick={() => setPurchaseFor({ id: r.id })}>Purchase</Button>

          }] :

          [])]
          } />

        }

        {tab === 'purchases' &&
        <DataTable
          rows={purchaseRows}
          loading={purchases.loading}
          error={purchases.error}
          onRetry={purchases.reload}
          getRowKey={(p) => p.id}
          emptyTitle="No purchases recorded"
          emptyMessage="Each material purchase is logged here as an expense."
          columns={[
          { key: 'date', header: 'Date', render: (p) => <span className="whitespace-nowrap text-muted">{formatDate(p.purchase_date)}</span> },
          {
            key: 'res',
            header: 'Material',
            render: (p) =>
            <div>
                    <p className="font-medium">{p.resource_name}</p>
                    <p className="text-xs text-muted">{p.resource_type === 'FABRIC' ? 'Fabric' : 'Other resource'}</p>
                  </div>

          },
          { key: 'qty', header: 'Quantity', align: 'right', render: (p) => formatQty(p.quantity, p.unit_of_measurement) },
          { key: 'unit', header: 'Unit cost', align: 'right', render: (p) => <span className="text-muted">{formatMoney(p.unit_cost)}</span> },
          { key: 'total', header: 'Expense', align: 'right', render: (p) => <span className="font-semibold">{formatMoney(p.total_cost)}</span> },
          {
            key: 'sup',
            header: 'Supplier',
            render: (p) =>
            <div>
                    <p>{p.supplier_name || '—'}</p>
                    {p.invoice_number && <p className="font-mono text-xs text-muted">{p.invoice_number}</p>}
                  </div>

          },
          { key: 'by', header: 'Recorded by', render: (p) => <span className="text-muted">{p.recorded_by_name ?? '—'}</span> }]
          } />

        }
      </Panel>

      <ResourceFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          reloadAll();
        }} />
      
      <ResourcePurchaseModal
        open={!!purchaseFor}
        resources={allResources.data ?? []}
        initialResourceId={purchaseFor?.id}
        onClose={() => setPurchaseFor(null)}
        onDone={() => {
          setPurchaseFor(null);
          reloadAll();
        }} />
      
    </div>);

}