import React from 'react';
import type { Bill, OrderDetail } from '../../types/api';
import type { BrandIdentity, DocNote } from '../../types/print';
import { company } from '../../data/company';
import { formatAmount, formatLongDate, toNumber } from '../../utils/format';
import { CommercialPaper } from '../print/commercial/CommercialPaper';
import { PartyPanels } from '../print/commercial/PartyPanels';
import { AvenorCommercialTable, type AvenorLineItem, type ExtraTotalRow } from '../print/commercial/AvenorCommercialTable';
import { NotesGrid } from '../print/commercial/NotesGrid';
import { CommercialSignatures } from '../print/commercial/CommercialSignatures';

interface BillDocumentProps {
  bill: Bill;
  order?: OrderDetail | null;
  brand: BrandIdentity;
}

export function BillDocument({ bill, order, brand }: BillDocumentProps) {
  const companyNameCustomer = bill.customer_company || order?.customer_company;
  const person = bill.customer_name || order?.customer_name || '';
  const orderCode = bill.order_code ?? order?.order_id ?? '';
  const companyName = (brand.company || company.name).toUpperCase();
  const isDeposit = bill.is_deposit_only;
  const depPct = toNumber(bill.deposit_percentage);

  // If order items exist, map them, otherwise create a representative bill line item
  const tableItems: AvenorLineItem[] = order?.items?.length
    ? order.items.map((i) => ({
        id: i.id,
        product_name: i.product_name,
        quantity: i.quantity,
        sizes: i.sizes,
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
          rate_type: 'Per bill',
          amount: bill.amount,
          unit_price: bill.amount,
          total_price: bill.amount
        }
      ];

  const subtotal = isDeposit && bill.total_order_amount ? bill.total_order_amount : bill.amount;

  const extraRows: ExtraTotalRow[] = [
    ...(isDeposit && depPct > 0 ? [{ label: `Deposit share (${depPct}%)`, value: bill.amount }] : []),
    ...(isDeposit && bill.balance_remaining
      ? [{ label: 'Remaining balance after deposit', value: bill.balance_remaining }]
      : [])
  ];

  const notes: DocNote[] = [
    {
      label: 'Bill reference',
      text: `Please quote ${bill.bill_number} with payments matching order ${orderCode || 'on file'}.`
    },
    {
      label: 'Terms & Conditions',
      text: isDeposit
        ? `This bill reflects the ${depPct}% advance deposit required to reserve blank stock and commence production.`
        : 'Payment is due according to the commercial credit terms agreed on confirmation.'
    },
    {
      label: 'Payment methods',
      text: `Bank transfer, cheque, card or cash. Send remittance advice to ${company.email}.`
    }
  ];

  return (
    <CommercialPaper
      brand={brand}
      title={isDeposit ? 'Deposit Bill' : 'Official Bill'}
      subtitle={isDeposit ? `Advance deposit bill (${depPct}%)` : 'Apparel production bill'}
      reference={bill.bill_number}
      dateLabel="Bill date"
      dateValue={formatLongDate(bill.bill_date)}
      dateNotes={[
        ...(orderCode ? [`Order ${orderCode}`] : []),
        ...(bill.invoice_number ? [`Invoice ${bill.invoice_number}`] : []),
        `Currency: ${company.currency}`
      ]}
    >
      <PartyPanels
        partyLabel="Bill to"
        partyName={person || companyNameCustomer || ''}
        partyLines={[person ? companyNameCustomer : '', order?.customer_phone]}
        brand={brand}
      />

      {/* Commercial Items Table matching Quotation format */}
      <AvenorCommercialTable
        items={tableItems}
        subtotal={subtotal}
        total={bill.amount}
        totalLabel={isDeposit ? 'DEPOSIT DUE' : 'TOTAL COST'}
        currencyPrefix="LKR"
        extraRows={extraRows}
        minRows={5}
      />

      {bill.notes && (
        <div className="rounded border border-[#d8e4f0] bg-[#f8fbfe] p-3 text-[11.5px] leading-relaxed">
          <p className="font-bold text-[#0b2545] uppercase tracking-wide text-[10.5px]">Notes / Instructions</p>
          <p className="mt-1 text-ink">{bill.notes}</p>
        </div>
      )}

      <NotesGrid title="Billing & payment notes" notes={notes} />
      <CommercialSignatures labels={[`For ${companyName}`, 'Received by customer']} />
    </CommercialPaper>
  );
}
