import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { ManufacturingCostReport } from '../../components/reports/ManufacturingCostReport';
import { ResourceExpenseReport } from '../../components/reports/ResourceExpenseReport';
import { SalesReport } from '../../components/reports/SalesReport';

type Tab = 'costing' | 'materials' | 'sales';

const TABS: {id: Tab;label: string;}[] = [
{ id: 'costing', label: 'Order cost & profit' },
{ id: 'materials', label: 'Material expenses' },
{ id: 'sales', label: 'Sales' }];


const DESCRIPTIONS: Record<Tab, string> = {
  costing: 'What each order cost to make, its profit, and the cost and profit per unit for every item.',
  materials: 'Fabric and other resource purchases, what was used in orders, and what is still in stock.',
  sales: 'Sales by brand, best customers and best-selling products.'
};

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('costing');

  return (
    <div>
      <PageHeader title="Reports" description={DESCRIPTIONS[tab]} />
      <div className="mb-6">
        <Tabs<Tab> tabs={TABS} active={tab} onChange={setTab} />
      </div>
      {tab === 'costing' && <ManufacturingCostReport />}
      {tab === 'materials' && <ResourceExpenseReport />}
      {tab === 'sales' && <SalesReport />}
    </div>);

}