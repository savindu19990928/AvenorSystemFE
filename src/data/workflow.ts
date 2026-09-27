import type { OrderStatus, Role } from '../types/api';

export const ORDER_PIPELINE: OrderStatus[] = [
'CUSTOMER_INQUIRY',
'QUOTATION',
'QUOTATION_APPROVED',
'DEPOSIT_PENDING',
'DEPOSIT_RECEIVED',
'ORDER_CONFIRMED',
'STOCK_RESERVED',
'ARTWORK_APPROVED',
'PRODUCTION',
'QUALITY_CHECK',
'PACKING',
'READY_FOR_DELIVERY',
'DELIVERY',
'INVOICE',
'PAYMENT_COMPLETED',
'ORDER_CLOSED'];


export const PIPELINE_PHASES: {label: string;statuses: OrderStatus[];}[] = [
{ label: 'Sales', statuses: ['CUSTOMER_INQUIRY', 'QUOTATION', 'QUOTATION_APPROVED'] },
{ label: 'Deposit', statuses: ['DEPOSIT_PENDING', 'DEPOSIT_RECEIVED'] },
{ label: 'Confirmed', statuses: ['ORDER_CONFIRMED', 'STOCK_RESERVED', 'ARTWORK_APPROVED'] },
{ label: 'Production', statuses: ['PRODUCTION', 'QUALITY_CHECK', 'PACKING'] },
{ label: 'Delivery', statuses: ['READY_FOR_DELIVERY', 'DELIVERY'] },
{ label: 'Billing', statuses: ['INVOICE', 'PAYMENT_COMPLETED'] },
{ label: 'Closed', statuses: ['ORDER_CLOSED'] }];


export const STATUS_ROLES: Record<OrderStatus, Role[]> = {
  CUSTOMER_INQUIRY: ['ADMIN', 'SALES'],
  QUOTATION: ['ADMIN', 'SALES'],
  QUOTATION_APPROVED: ['ADMIN', 'SALES'],
  DEPOSIT_PENDING: ['ADMIN', 'SALES', 'ACCOUNTS'],
  DEPOSIT_RECEIVED: ['ADMIN', 'SALES', 'ACCOUNTS'],
  ORDER_CONFIRMED: ['ADMIN', 'SALES'],
  STOCK_RESERVED: ['ADMIN', 'SALES', 'STORE_KEEPER'],
  ARTWORK_APPROVED: ['ADMIN', 'SALES'],
  PRODUCTION: ['ADMIN', 'SALES', 'PRODUCTION'],
  QUALITY_CHECK: ['ADMIN', 'PRODUCTION'],
  PACKING: ['ADMIN', 'PRODUCTION'],
  READY_FOR_DELIVERY: ['ADMIN', 'PRODUCTION'],
  DELIVERY: ['ADMIN', 'DELIVERY'],
  INVOICE: ['ADMIN', 'ACCOUNTS'],
  PAYMENT_COMPLETED: ['ADMIN', 'ACCOUNTS'],
  ORDER_CLOSED: ['ADMIN', 'SALES', 'ACCOUNTS'],
  CANCELLED: ['ADMIN', 'SALES']
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  SALES: 'Sales',
  PRODUCTION: 'Production',
  STORE_KEEPER: 'Store Keeper',
  ACCOUNTS: 'Accounts',
  DELIVERY: 'Delivery'
};

export const ROLES: Role[] = ['ADMIN', 'SALES', 'PRODUCTION', 'STORE_KEEPER', 'ACCOUNTS', 'DELIVERY'];

export const CUSTOMER_TYPES = [
{ value: 'CORPORATE', label: 'Corporate' },
{ value: 'RETAIL', label: 'Retail' },
{ value: 'EVENT_ORGANIZER', label: 'Event organizer' },
{ value: 'GOVERNMENT', label: 'Government' }];


export const INQUIRY_STATUSES = ['NEW', 'CONTACTED', 'QUOTATION_SENT', 'CONVERTED', 'LOST'];
export const QUOTATION_STATUSES = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED'];
export const ARTWORK_STATUSES = ['DRAFT', 'SENT_TO_CUSTOMER', 'REVISION', 'APPROVED'];
export const DELIVERY_STATUSES = ['READY', 'DELIVERY_PENDING', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export const PAYMENT_METHODS = [
{ value: 'CASH', label: 'Cash' },
{ value: 'BANK_TRANSFER', label: 'Bank transfer' },
{ value: 'CARD', label: 'Card' },
{ value: 'CHEQUE', label: 'Cheque' },
{ value: 'ONLINE', label: 'Online payment' }];


export const PAYMENT_TYPES = [
{ value: 'DEPOSIT', label: 'Deposit' },
{ value: 'BALANCE', label: 'Balance payment' }];


export const EXPENSE_TYPES = [
{ value: 'TSHIRT_COST', label: 'T-shirt cost' },
{ value: 'PRINTING_COST', label: 'Printing cost' },
{ value: 'LABOUR', label: 'Labour' },
{ value: 'PACKAGING', label: 'Packaging' },
{ value: 'DELIVERY', label: 'Delivery' },
{ value: 'OTHER', label: 'Other expenses' }];


export const DOCUMENT_TYPES = [
{ value: 'QUOTATION', label: 'Quotation' },
{ value: 'CUSTOMER_ARTWORK', label: 'Customer artwork' },
{ value: 'APPROVED_ARTWORK', label: 'Approved artwork' },
{ value: 'PURCHASE_ORDER', label: 'Purchase order' },
{ value: 'INVOICE', label: 'Invoice' },
{ value: 'PAYMENT_RECEIPT', label: 'Payment receipt' },
{ value: 'DELIVERY_NOTE', label: 'Delivery note' },
{ value: 'NOTES', label: 'Notes / messages' },
{ value: 'FINAL_DOCUMENT', label: 'Final document' }];


export const PRODUCT_TYPES = [
{ value: 'TSHIRT', label: 'T-shirt' },
{ value: 'POLO', label: 'Polo' },
{ value: 'HOODIE', label: 'Hoodie' },
{ value: 'CAP', label: 'Cap' },
{ value: 'TOTE_BAG', label: 'Tote bag' }];


export const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

export function canSetStatus(role: Role | undefined, status: OrderStatus): boolean {
  if (!role) return false;
  return STATUS_ROLES[status].includes(role);
}

export function nextStatus(current: OrderStatus): OrderStatus | null {
  const idx = ORDER_PIPELINE.indexOf(current);
  if (idx === -1 || idx === ORDER_PIPELINE.length - 1) return null;
  return ORDER_PIPELINE[idx + 1];
}