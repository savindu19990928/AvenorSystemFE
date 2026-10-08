import type { AutoPaymentResult, Invoice } from '../types/api';
import { DEFAULT_DEPOSIT_PERCENT } from '../data/workflow';
import { api } from './api';
import { formatMoney, toNumber } from './format';

export type AutoPaymentMode = 'deposit' | 'complete';

export interface AutoPaymentValues {
  amount: string;
  payment_method: string;
  reference_number: string;
  notes: string;
}

/** Deposit the server would default to: the order's required deposit, else 60% of the total. */
export function suggestedDeposit(order: {total_amount?: string;deposit_required?: string;}): number {
  return toNumber(order.deposit_required) || depositAmount(toNumber(order.total_amount), DEFAULT_DEPOSIT_PERCENT);
}

/** Records a deposit or settles the balance; the backend creates the Payment and advances the order. */
export function submitAutoPayment(orderId: number, mode: AutoPaymentMode, v: AutoPaymentValues): Promise<AutoPaymentResult> {
  const common = { payment_method: v.payment_method, reference_number: v.reference_number, notes: v.notes };
  return mode === 'deposit' ?
  api.post<AutoPaymentResult>(`/api/orders/orders/${orderId}/deposit/`, { amount: Number(v.amount).toFixed(2), ...common }) :
  api.post<AutoPaymentResult>(`/api/orders/orders/${orderId}/mark-payment-completed/`, common);
}

export function autoPaymentMessage(mode: AutoPaymentMode, res: AutoPaymentResult): string {
  const p = res.auto_payment;
  if (p) return `${p.payment_id} · ${formatMoney(p.amount)} ${mode === 'deposit' ? 'deposit' : 'balance'} recorded automatically`;
  return mode === 'deposit' ? `${res.order_id} moved to Deposit received` : `${res.order_id} marked payment completed`;
}

export function depositAmount(total: number, percent: number): number {
  return Math.round(total * percent / 100 * 100) / 100;
}

export function isValidPercent(value: string): boolean {
  const n = Number(value);
  return value.trim() !== '' && n > 0 && n <= 100;
}

export function depositTerms(percent: number): string {
  const p = Number(percent.toFixed(2));
  return `${p}% Advance Deposit on Confirmation, ${Number((100 - p).toFixed(2))}% on Delivery`;
}

export function parseDepositPercent(terms?: string | null): number {
  const match = terms?.match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? Number(match[1]) : DEFAULT_DEPOSIT_PERCENT;
}

export function invoiceDepositPercent(invoice: Invoice): number {
  return toNumber(invoice.deposit_percentage) || DEFAULT_DEPOSIT_PERCENT;
}

export function invoiceDepositAmount(invoice: Invoice): number {
  return toNumber(invoice.deposit_amount) || depositAmount(toNumber(invoice.total_amount), invoiceDepositPercent(invoice));
}

/** An unpaid, active invoice can be turned into a running order once the customer pays the deposit. */
export function canConvertInvoice(invoice: Invoice): boolean {
  return !!invoice.id && invoice.status !== 'CANCELLED' && !invoice.is_deposit_only && toNumber(invoice.paid_amount) === 0;
}