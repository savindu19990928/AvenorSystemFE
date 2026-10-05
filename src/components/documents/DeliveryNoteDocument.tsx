import React from 'react';
import type { DeliveryNote } from '../../types/api';
import type { BrandIdentity } from '../../types/print';
import { formatDateTime, formatNumber, toPrintLine } from '../../utils/format';
import { DocumentPaper } from '../print/DocumentPaper';
import { PrintItemsTable } from '../print/PrintItemsTable';
import { PrintParty } from '../print/PrintParty';
import { PrintSignatures } from '../print/PrintSignatures';

export function DeliveryNoteDocument({ note, brand }: {note: DeliveryNote;brand: BrandIdentity;}) {
  const c = note.customer;
  return (
    <DocumentPaper
      brand={brand}
      title={note.document_title || 'Delivery note'}
      number={note.delivery_number}
      meta={[
      { label: 'Order', value: note.order_id },
      { label: 'Issued', value: formatDateTime(note.issued_at) },
      { label: 'Courier', value: note.dispatch_details.courier_name },
      { label: 'Tracking', value: note.dispatch_details.tracking_number }]
      }>
      
      <div className="grid grid-cols-2 gap-8">
        <PrintParty label="Deliver to" name={c.company_name || c.contact_person} lines={[c.company_name ? c.contact_person : '', c.phone, c.delivery_address]} />
        <PrintParty label="Dispatched" name={formatDateTime(note.dispatch_details.dispatched_date)} lines={[]} />
      </div>
      <PrintItemsTable items={note.items.map(toPrintLine)} showPrices={false} />
      <div className="flex justify-end gap-6 text-base font-semibold">
        <span>Total pieces</span>
        <span className="tabular-nums">{formatNumber(note.total_packages_or_pieces)}</span>
      </div>
      {note.special_instructions &&
      <section>
          <p className="text-[11px] text-faint">Special instructions</p>
          <p className="mt-0.5">{note.special_instructions}</p>
        </section>
      }
      <PrintSignatures labels={['Dispatched by', 'Received by (name & signature)']} />
    </DocumentPaper>);

}