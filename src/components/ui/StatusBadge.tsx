import React from 'react';
import { humanize } from '../../utils/format';
import { cx } from '../../utils/styles';

type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral';

const TONES: Record<Tone, string> = {
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  neutral: 'bg-canvas text-muted border border-line'
};

const OK = ['APPROVED', 'COMPLETED', 'DELIVERED', 'PAID', 'ORDER_CLOSED', 'CONVERTED', 'PAYMENT_COMPLETED', 'DEPOSIT_RECEIVED', 'ISSUED', 'INWARD', 'ARTWORK_APPROVED', 'INFO_OK'];
const WARN = ['PENDING', 'DRAFT', 'REVISION', 'PARTIALLY_PAID', 'DEPOSIT_PENDING', 'NEW', 'WARNING', 'UNPAID', 'READY_FOR_DELIVERY', 'QUOTATION', 'SENT', 'SENT_TO_CUSTOMER', 'DELIVERY_PENDING', 'CUSTOMER_INQUIRY'];
const DANGER = ['CANCELLED', 'REJECTED', 'EXPIRED', 'LOST', 'OVERDUE', 'CRITICAL', 'DAMAGED'];
const INFO = ['IN_PROGRESS', 'PRODUCTION', 'QUALITY_CHECK', 'PACKING', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERY', 'INVOICE', 'RESERVED', 'STOCK_RESERVED', 'ORDER_CONFIRMED', 'CONTACTED', 'QUOTATION_SENT', 'QUOTATION_APPROVED', 'READY'];

export function toneFor(status?: string): Tone {
  const s = (status ?? '').toUpperCase();
  if (OK.includes(s)) return 'ok';
  if (DANGER.includes(s)) return 'danger';
  if (WARN.includes(s)) return 'warn';
  if (INFO.includes(s)) return 'info';
  return 'neutral';
}

export function StatusBadge({ status, label, className }: {status?: string;label?: string;className?: string;}) {
  return (
    <span className={cx('inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', TONES[toneFor(status)], className)}>
      {label ?? humanize(status)}
    </span>);

}