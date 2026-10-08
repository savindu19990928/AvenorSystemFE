import type { ReportSpec } from '../types/print';
import type { ManufacturingCostReport, OrderCostBreakdown, ResourcesExpenseReport } from '../types/resources';
import { formatDate, formatMoney, formatNumber, humanize, todayISO, toNumber } from './format';
import { formatQty } from './resources';

export function manufacturingCostSpec(data: ManufacturingCostReport, scopeLabel: string): ReportSpec {
  const t = data.aggregate_totals;
  return {
    title: 'Order manufacturing cost & profit',
    subtitle: scopeLabel,
    filename: `manufacturing-cost-${todayISO()}`,
    summary: [
    { label: 'Gross profit', value: formatMoney(t.total_gross_profit) },
    { label: 'Revenue', value: formatMoney(t.total_revenue) },
    { label: 'Cost to make', value: formatMoney(t.total_manufacturing_cost) },
    { label: 'Margin', value: `${t.overall_profit_margin_percent.toFixed(1)}%` }],

    sections: [
    {
      title: 'Orders',
      columns: [
      { header: 'Order' },
      { header: 'Customer' },
      { header: 'Brand' },
      { header: 'Manufacture' },
      { header: 'Units', format: 'number' },
      { header: 'Revenue', format: 'money' },
      { header: 'Fabric', format: 'money' },
      { header: 'Other resources', format: 'money' },
      { header: 'Other expenses', format: 'money' },
      { header: 'Cost to make', format: 'money' },
      { header: 'Cost / unit', format: 'money' },
      { header: 'Profit', format: 'money' },
      { header: 'Margin', format: 'percent' }],

      rows: data.orders.map((o) => [
      o.order_id,
      o.customer,
      o.brand,
      o.is_manufacture_finished ? 'Finished' : 'In progress',
      o.total_units_produced,
      o.financials.revenue,
      o.financials.fabric_cost,
      o.financials.other_resources_cost,
      o.financials.other_expenses_cost,
      o.financials.total_manufacturing_cost,
      o.financials.cost_per_unit_average,
      o.financials.net_profit,
      o.financials.profit_margin_percent]
      ),
      footer: [
      'Total',
      '',
      '',
      '',
      t.total_units_manufactured,
      t.total_revenue,
      t.total_fabric_cost,
      t.total_other_resources_cost,
      t.total_other_expenses_cost,
      t.total_manufacturing_cost,
      t.average_cost_per_unit,
      t.total_gross_profit,
      t.overall_profit_margin_percent],

      emptyText: 'No orders match these filters'
    },
    {
      title: 'Per-unit item economics',
      columns: [
      { header: 'Order' },
      { header: 'Item' },
      { header: 'Qty', format: 'number' },
      { header: 'Sell / unit', format: 'money' },
      { header: 'Cost / unit', format: 'money' },
      { header: 'Profit / unit', format: 'money' },
      { header: 'Margin', format: 'percent' },
      { header: 'Item profit', format: 'money' }],

      rows: data.orders.flatMap((o) =>
      (o.items_breakdown ?? []).map((i) => [
      o.order_id,
      [i.product_name, i.colour, i.size].filter(Boolean).join(' · '),
      i.quantity,
      i.unit_selling_price,
      i.unit_manufacturing_cost,
      i.unit_profit,
      i.profit_margin_percent,
      i.total_profit]
      )
      ),
      emptyText: 'No line items'
    }]

  };
}

export function orderCostSpec(o: OrderCostBreakdown): ReportSpec {
  const f = o.financials;
  return {
    title: `Cost breakdown · ${o.order_id}`,
    subtitle: `${o.customer} · ${o.brand} · ${humanize(o.status)}${o.is_manufacture_finished ? ' · Manufacturing finished' : ''}`,
    filename: `cost-breakdown-${o.order_id}`,
    summary: [
    { label: 'Net profit', value: formatMoney(f.net_profit) },
    { label: 'Revenue', value: formatMoney(f.revenue) },
    { label: 'Cost to make', value: formatMoney(f.total_manufacturing_cost) },
    { label: 'Margin', value: `${f.profit_margin_percent.toFixed(1)}%` }],

    sections: [
    {
      title: 'Cost composition',
      columns: [{ header: 'Component' }, { header: 'Detail' }, { header: 'Amount', format: 'money' }],
      rows: [
      ['Fabric', formatQty(f.fabric_quantity_kg, 'kg'), f.fabric_cost],
      ['Other resources', '', f.other_resources_cost],
      ['Other expenses', 'Labour, printing, packaging, etc.', f.other_expenses_cost]],

      footer: ['Total cost to make', `${formatNumber(o.total_units_produced)} units · ${formatMoney(f.cost_per_unit_average)} avg / unit`, f.total_manufacturing_cost]
    },
    {
      title: 'Per-unit item economics',
      columns: [
      { header: 'Item' },
      { header: 'Qty', format: 'number' },
      { header: 'Sell / unit', format: 'money' },
      { header: 'Cost / unit', format: 'money' },
      { header: 'Profit / unit', format: 'money' },
      { header: 'Margin', format: 'percent' },
      { header: 'Item profit', format: 'money' }],

      rows: (o.items_breakdown ?? []).map((i) => [
      [i.product_name, i.colour, i.size].filter(Boolean).join(' · '),
      i.quantity,
      i.unit_selling_price,
      i.unit_manufacturing_cost,
      i.unit_profit,
      i.profit_margin_percent,
      i.total_profit]
      ),
      emptyText: 'No line items'
    },
    {
      title: 'Materials used',
      columns: [{ header: 'Material' }, { header: 'Quantity' }, { header: 'Unit cost', format: 'money' }, { header: 'Cost', format: 'money' }],
      rows: (o.resources_used ?? []).map((r) => [r.resource_name, formatQty(r.quantity_used, r.unit_of_measurement), r.unit_cost, r.total_cost]),
      emptyText: 'No materials allocated'
    }]

  };
}

export function resourceExpenseSpec(data: ResourcesExpenseReport, scopeLabel: string): ReportSpec {
  const s = data.summary;
  return {
    title: 'Material purchases & resource expenses',
    subtitle: scopeLabel,
    filename: `material-expenses-${todayISO()}`,
    summary: [
    { label: 'Total purchases', value: formatMoney(s.total_purchases_expense) },
    { label: 'Fabric bought', value: `${formatMoney(s.fabric_purchases.total_cost)} · ${formatQty(s.fabric_purchases.total_quantity_kg, 'kg')}` },
    { label: 'Used in orders', value: formatMoney(s.used_in_production_orders.total_materials_cost_consumed) },
    { label: 'Stock value', value: formatMoney(s.current_inventory.total_stock_valuation) }],

    sections: [
    {
      title: 'Purchases',
      columns: [
      { header: 'Date' },
      { header: 'Material' },
      { header: 'Quantity' },
      { header: 'Unit cost', format: 'money' },
      { header: 'Expense', format: 'money' },
      { header: 'Supplier' },
      { header: 'Invoice' }],

      rows: data.purchases.map((p) => [
      formatDate(p.purchase_date),
      p.resource_name,
      formatQty(p.quantity, p.unit_of_measurement),
      p.unit_cost,
      p.total_cost,
      p.supplier_name,
      p.invoice_number]
      ),
      footer: ['Total', '', '', '', data.purchases.reduce((t, p) => t + toNumber(p.total_cost), 0), '', ''],
      emptyText: 'No purchases in this period'
    },
    {
      title: 'Stock on hand',
      columns: [{ header: 'Material' }, { header: 'In stock' }, { header: 'Unit cost', format: 'money' }, { header: 'Value', format: 'money' }],
      rows: data.stock_inventory.map((r) => [r.name, formatQty(r.current_stock_quantity, r.unit_of_measurement), r.unit_cost, r.stock_valuation]),
      footer: ['Total', '', '', s.current_inventory.total_stock_valuation],
      emptyText: 'No materials defined'
    }]

  };
}