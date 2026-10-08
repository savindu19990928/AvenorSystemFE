import type { Invoice } from '../types/api';
import { DEFAULT_DEPOSIT_PERCENT } from '../data/workflow';
import { toNumber } from './format';

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