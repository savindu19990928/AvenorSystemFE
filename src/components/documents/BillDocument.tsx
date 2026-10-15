import React from 'react';
import type { Bill, OrderDetail } from '../../types/api';
import type { BrandIdentity } from '../../types/print';
import { formatAmount, formatLongDate, toNumber } from '../../utils/format';
import { AvenorCommercialLayout } from '../print/commercial/AvenorCommercialLayout';
import { AvenorDocTable, type AvenorDocTableItem, type ExtraTotalRow } from '../print/commercial/AvenorDocTable';

interface BillDocumentProps {
  bill: Bill;
  order?: OrderDetail | null;
  brand: BrandIdentity;
}

export function BillDocument({ bill, order, brand }: BillDocumentProps) {
  const companyNameCustomer = bill.customer_company || order?.customer_company;
  const person = bill.customer_name || order?.customer_name || '';
  const orderCode = bill.order_code ?? order?.order_id ?? '';
  const isDeposit = bill.is_deposit_only;
  const depPct = toNumber(bill.deposit_percentage);

  const rawItems = order?.items ?? [];
  const items: AvenorDocTableItem[] = rawItems.length > 0
    ? rawItems.map((i) => ({
        id: i.id,
        product_name: i.product_name,
        quantity: i.quantity,
        size: i.size,
        sizes: i.sizes,
        colour: i.colour,
        colours: i.colours,
        fabric_gsm: i.fabric_gsm,
        printing_method: i.printing_method,
        unit_price: i.unit_price,
        total_price: i.total_price
      }))
    : [
        {
          product_name: isDeposit
            ? `Advance Deposit (${depPct}% Required) for Order ${orderCode || 'on file'}`
            : `Production & Apparel Billing for Order ${orderCode || 'on file'}`,
          quantity: 1,
          unit_price: bill.amount,
          total_price: bill.amount
        }
      ];

  const subtotal = isDeposit && bill.total_order_amount ? toNumber(bill.total_order_amount) : toNumber(bill.amount);

  const extraRows: ExtraTotalRow[] = [
    ...(isDeposit && depPct > 0 ? [{ label: `Deposit Due (${depPct}%)`, value: bill.amount }] : []),
    ...(isDeposit && bill.balance_remaining
      ? [{ label: 'Remaining Balance After Deposit', value: bill.balance_remaining, isDue: true }]
      : [])
  ];

  const metaItems = [
    { label: 'BILL NO :', value: bill.bill_number },
    { label: 'DATE :', value: formatLongDate(bill.bill_date) },
    {
      label: 'BILL TYPE :',
      value: isDeposit ? `Advance Deposit (${depPct}%)` : `Standard Bill ${orderCode ? `(${orderCode})` : ''}`
    }
  ];

  const paymentTermsText = isDeposit
    ? `This bill represents the ${depPct}% advance deposit required to confirm the order and commence bulk production.`
    : 'Payment due upon agreed commercial payment terms.';

  return (
    <AvenorCommercialLayout
      documentTitle={isDeposit ? 'DEPOSIT BILL' : 'COMMERCIAL BILL'}
      brand={brand}
      metaItems={metaItems}
      customerName={person}
      customerCompany={companyNameCustomer}
      customerPhone={order?.customer_phone}
      customerSignatureLabel="Received by Customer"
      stamp={isDeposit ? { label: 'DEPOSIT BILL', tone: 'warning' } : undefined}
      notes={bill.notes}
    >
      <AvenorDocTable
        items={items}
        subtotal={subtotal}
        grandTotal={bill.amount}
        extraRows={extraRows}
        minRows={5}
        paymentTerms={paymentTermsText}
        deliveryLocation={
          order?.delivery_address ||
          (order as any)?.delivery_location ||
          (bill as any)?.delivery_location ||
          bill.notes
        }
      />
    </AvenorCommercialLayout>
  );
}
