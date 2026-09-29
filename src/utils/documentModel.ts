import type { Customer, Invoice, LineItem, OrderDetail, Quotation } from '../types/api';
import type { DocAmount, DocBrand, DocLine, DocPageSlice, DocParty, PrintableDocument } from '../types/documents';
import { formatDate, toNumber, todayISO } from './format';

export function quotationToDocument(q: Quotation, customer: Customer | null, brand: DocBrand): PrintableDocument {
  const lines = (q.items ?? []).map(toDocLine);
  const rate = toNumber(q.tax_rate_percent);
  return {
    kind: 'QUOTATION',
    number: q.quotation_number,
    issueDate: formatDate(q.created_at ?? todayISO()),
    dueLabel: 'Valid until',
    dueDate: formatDate(q.validity_date),
    reference: q.created_by_name ? { label: 'Prepared by', value: q.created_by_name } : undefined,
    billTo: toParty(customer, q.customer_company, q.customer_name),
    brand,
    lines,
    subtotal: toNumber(q.subtotal) || sumLines(lines),
    charges: charges([['Artwork charges', q.artwork_charges], ['Delivery charges', q.delivery_charges]]),
    discount: toNumber(q.discount_amount),
    tax: { label: rate > 0 ? `VAT (${rate}%)` : 'VAT', amount: toNumber(q.tax_amount) },
    total: toNumber(q.total_amount),
    paymentTerms: q.payment_terms,
    notes: q.notes
  };
}

export function invoiceToDocument(inv: Invoice, order: OrderDetail, customer: Customer | null, brand: DocBrand): PrintableDocument {
  const lines = (order.items ?? []).map(toDocLine);
  return {
    kind: 'INVOICE',
    number: inv.invoice_number,
    issueDate: formatDate(inv.invoice_date ?? todayISO()),
    dueLabel: 'Due date',
    dueDate: formatDate(inv.due_date),
    reference: { label: 'Order reference', value: inv.order_code ?? order.order_id },
    billTo: toParty(customer, inv.customer_company ?? order.customer_company, inv.customer_name ?? order.customer_name),
    brand,
    lines,
    subtotal: toNumber(inv.subtotal ?? order.subtotal) || sumLines(lines),
    charges: charges([['Artwork charges', order.artwork_charges], ['Delivery charges', inv.delivery_fee ?? order.delivery_charges]]),
    discount: toNumber(inv.discount_amount ?? order.discount_amount),
    tax: { label: 'VAT', amount: toNumber(inv.tax_amount ?? order.tax_amount) },
    total: toNumber(inv.total_amount),
    paid: toNumber(inv.paid_amount),
    balance: toNumber(inv.balance_amount)
  };
}

/** Split lines across A4 pages, keeping the totals/terms block with at least one line on the last page. */
export function paginateLines(lines: DocLine[]): DocPageSlice[] {
  const SINGLE = 6;
  const FIRST = 14;
  const MIDDLE = 20;
  const LAST = 13;
  if (lines.length <= SINGLE) return [{ lines, startIndex: 0 }];
  const pages: DocPageSlice[] = [];
  let index = 0;
  let first = true;
  while (index < lines.length) {
    const remaining = lines.length - index;
    const lastCap = first ? SINGLE : LAST;
    if (remaining <= lastCap) {
      pages.push({ lines: lines.slice(index), startIndex: index });
      break;
    }
    const take = Math.min(first ? FIRST : MIDDLE, remaining - 1);
    pages.push({ lines: lines.slice(index, index + take), startIndex: index });
    index += take;
    first = false;
  }
  return pages;
}

export function documentFilename(doc: PrintableDocument, suffix = ''): string {
  const kind = doc.kind === 'QUOTATION' ? 'Quotation' : 'Invoice';
  const who = doc.billTo.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  return `${kind}-${doc.number}${who ? `-${who}` : ''}${suffix}.pdf`;
}

export function letterFor(name: string): string {
  const match = name.trim().match(/[a-z0-9]/i);
  return match ? match[0].toUpperCase() : '•';
}

function toDocLine(i: LineItem): DocLine {
  const unitPrice = toNumber(i.unit_price);
  return {
    description: i.product_name,
    spec: [i.colour, i.fabric_gsm, i.printing_method].filter(Boolean).join(' · '),
    size: i.size || '—',
    quantity: i.quantity,
    unitPrice,
    total: toNumber(i.total_price) || unitPrice * i.quantity
  };
}

function toParty(customer: Customer | null, company?: string, name?: string): DocParty {
  const displayName = customer?.company_name || company || name || 'Customer';
  const contact = customer?.contact_person || (company && name && company !== name ? name : undefined);
  return {
    name: displayName,
    contact,
    address: customer?.billing_address || undefined,
    phone: customer?.phone || undefined,
    email: customer?.email || undefined,
    taxNumber: customer?.tax_number || undefined
  };
}

function charges(entries: [string, string | undefined][]): DocAmount[] {
  return entries.map(([label, v]) => ({ label, amount: toNumber(v) })).filter((c) => c.amount > 0);
}

function sumLines(lines: DocLine[]): number {
  return lines.reduce((s, l) => s + l.total, 0);
}