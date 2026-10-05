import type { Invoice, Payment, ProfitRow, ReportsData } from '../types/api';
import type { ReportSpec } from '../types/print';
import { EXPENSE_TYPES } from '../data/workflow';
import { formatDate, formatMoney, formatNumber, humanize, todayISO, toNumber } from './format';

const sum = <T,>(list: T[], pick: (x: T) => string | number | undefined) => list.reduce((s, x) => s + toNumber(pick(x)), 0);

export function salesReport(data: ReportsData): ReportSpec {
  const sales = sum(data.sales_by_brand, (b) => b.total_sales);
  const orders = sum(data.sales_by_brand, (b) => b.orders_count);
  return {
    title: 'Sales report',
    subtitle: 'Sales by brand, best customers and best-selling products.',
    filename: `sales-report-${todayISO()}`,
    summary: [
    { label: 'Total sales', value: formatMoney(sales) },
    { label: 'Orders', value: formatNumber(orders) },
    { label: 'Cancelled orders', value: formatNumber(data.cancelled_orders_count) },
    { label: 'As of', value: formatDate(todayISO()) }],

    sections: [
    {
      title: 'Sales by brand',
      columns: [{ header: 'Brand' }, { header: 'Positioning' }, { header: 'Orders', format: 'number' }, { header: 'Total sales', format: 'money' }],
      rows: data.sales_by_brand.map((b) => [b.brand, b.positioning, b.orders_count, b.total_sales]),
      footer: ['Total', '', orders, sales]
    },
    {
      title: 'Best customers',
      columns: [{ header: 'Customer' }, { header: 'Contact' }, { header: 'Type' }, { header: 'Orders', format: 'number' }, { header: 'Total purchases', format: 'money' }],
      rows: data.top_customers.map((c) => [c.customer_name, c.contact_person, humanize(c.type), c.orders_count, c.total_purchases]),
      emptyText: 'No customer sales yet'
    },
    {
      title: 'Best-selling products',
      columns: [{ header: 'Product' }, { header: 'Brand' }, { header: 'Units sold', format: 'number' }, { header: 'Revenue', format: 'money' }],
      rows: data.top_products.map((p) => [p.product_name, p.brand, p.units_sold, p.revenue]),
      emptyText: 'No product sales yet'
    }]

  };
}

const VIEW_LABEL = { by_order: 'Order', by_brand: 'Brand', by_month: 'Month' } as const;

export function profitReport(rows: ProfitRow[], view: keyof typeof VIEW_LABEL, scopeLabel: string): ReportSpec {
  const revenue = sum(rows, (r) => r.revenue);
  const cost = sum(rows, (r) => r.total_cost);
  const profit = sum(rows, (r) => r.net_profit);
  return {
    title: 'Profit report',
    subtitle: `Revenue − costs = profit, by ${VIEW_LABEL[view].toLowerCase()} · ${scopeLabel}`,
    filename: `profit-${view.replace('_', '-')}-${todayISO()}`,
    summary: [
    { label: 'Net profit', value: formatMoney(profit) },
    { label: 'Revenue', value: formatMoney(revenue) },
    { label: 'Total cost', value: formatMoney(cost) },
    { label: 'Margin', value: `${(revenue ? profit / revenue * 100 : 0).toFixed(1)}%` }],

    sections: [
    {
      columns: [
      { header: VIEW_LABEL[view] },
      { header: 'Revenue', format: 'money' },
      ...EXPENSE_TYPES.map((t) => ({ header: t.label, format: 'money' as const })),
      { header: 'Total cost', format: 'money' },
      { header: 'Profit', format: 'money' },
      { header: 'Margin', format: 'percent' }],

      rows: rows.map((r) => [
      view === 'by_order' ? [r.order_id, r.customer].filter(Boolean).join(' · ') : view === 'by_brand' ? r.brand : r.month,
      r.revenue,
      ...EXPENSE_TYPES.map((t) => r.costs?.[t.value] ?? 0),
      r.total_cost,
      r.net_profit,
      r.profit_margin_percent]
      ),
      footer: [
      'Total',
      revenue,
      ...EXPENSE_TYPES.map((t) => sum(rows, (r) => r.costs?.[t.value])),
      cost,
      profit,
      revenue ? profit / revenue * 100 : 0]

    }]

  };
}

export function invoicesReport(list: Invoice[], filterLabel: string): ReportSpec {
  const live = list.filter((i) => i.status !== 'CANCELLED');
  return {
    title: 'Invoice register',
    subtitle: `${filterLabel} invoices · cancelled invoices are listed but excluded from totals`,
    filename: `invoices-${filterLabel.toLowerCase().replace(/\s+/g, '-')}-${todayISO()}`,
    summary: [
    { label: 'Invoices', value: formatNumber(list.length) },
    { label: 'Invoiced', value: formatMoney(sum(live, (i) => i.total_amount)) },
    { label: 'Collected', value: formatMoney(sum(live, (i) => i.paid_amount)) },
    { label: 'Outstanding', value: formatMoney(sum(live, (i) => i.balance_amount)) }],

    sections: [
    {
      columns: [
      { header: 'Invoice' },
      { header: 'Order' },
      { header: 'Customer' },
      { header: 'Brand' },
      { header: 'Issued' },
      { header: 'Due' },
      { header: 'Status' },
      { header: 'Total', format: 'money' },
      { header: 'Paid', format: 'money' },
      { header: 'Balance', format: 'money' }],

      rows: list.map((i) => [
      i.invoice_number,
      i.order_code,
      i.customer_company || i.customer_name,
      i.brand_name,
      formatDate(i.invoice_date),
      formatDate(i.due_date),
      humanize(i.status),
      i.total_amount,
      i.paid_amount,
      i.balance_amount]
      ),
      footer: ['Total (excl. cancelled)', '', '', '', '', '', '', sum(live, (i) => i.total_amount), sum(live, (i) => i.paid_amount), sum(live, (i) => i.balance_amount)]
    }]

  };
}

export function paymentsReport(list: Payment[], filterLabel: string): ReportSpec {
  const total = sum(list, (p) => p.amount);
  return {
    title: 'Payments report',
    subtitle: filterLabel,
    filename: `payments-${todayISO()}`,
    summary: [
    { label: 'Payments', value: formatNumber(list.length) },
    { label: 'Total received', value: formatMoney(total) },
    { label: 'Deposits', value: formatMoney(sum(list.filter((p) => p.payment_type === 'DEPOSIT'), (p) => p.amount)) },
    { label: 'Balance payments', value: formatMoney(sum(list.filter((p) => p.payment_type === 'BALANCE'), (p) => p.amount)) }],

    sections: [
    {
      columns: [
      { header: 'Payment ID' },
      { header: 'Date' },
      { header: 'Customer' },
      { header: 'Order' },
      { header: 'Type' },
      { header: 'Method' },
      { header: 'Reference' },
      { header: 'Amount', format: 'money' }],

      rows: list.map((p) => [
      p.payment_id,
      formatDate(p.payment_date),
      p.customer_name,
      p.order_code,
      p.payment_type_display ?? humanize(p.payment_type),
      p.payment_method_display ?? humanize(p.payment_method),
      p.reference_number,
      p.amount]
      ),
      footer: ['Total', '', '', '', '', '', '', total]
    }]

  };
}