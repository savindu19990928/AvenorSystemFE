import React, { useState } from 'react';
import type { Quotation, Invoice, Payment } from '../types/api';
import type { BrandIdentity } from '../types/print';
import { QuotationDocument } from '../components/documents/QuotationDocument';
import { InvoiceDocument } from '../components/documents/InvoiceDocument';
import { ReceiptDocument } from '../components/documents/ReceiptDocument';
import { Button } from '../components/ui/Button';
import { downloadPdf, printElement } from '../utils/print';
import { DownloadIcon, PrinterIcon } from 'lucide-react';

const mockZevoraQuotation: Quotation = {
  id: 101,
  quotation_number: 'QT-2026-0088',
  brand: 1,
  brand_name: 'Zevora Custom',
  customer: 12,
  customer_name: 'Kasun Wickramasinghe',
  customer_company: 'Apex Technologies PLC',
  status: 'PENDING',
  created_at: '2026-10-15T10:30:00Z',
  validity_date: '2026-11-15T00:00:00Z',
  subtotal: 185000,
  discount_amount: 5000,
  tax_amount: 0,
  tax_rate_percent: 0,
  delivery_charges: 2500,
  artwork_charges: 0,
  total_amount: 182500,
  payment_terms: '50% advance upon order confirmation, balance prior to delivery.',
  notes: 'Custom embroidery on left chest and screen print on back.',
  items: [
    {
      id: 1,
      quotation: 101,
      product_name: 'Custom Corporate Polo T-Shirt',
      description: 'Pique knit fabric with ribbed collar & custom embroidery',
      size: 'S - XXL',
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      colour: 'Navy Blue / Gold Tip',
      colours: ['Navy Blue', 'Gold Tip'],
      fabric_gsm: '220 GSM Pique Cotton',
      printing_method: 'Embroidery (Left Chest)',
      quantity: 100,
      unit_price: 1250,
      total_price: 125000
    },
    {
      id: 2,
      quotation: 101,
      product_name: 'Premium Crewneck Cotton T-Shirt',
      description: '100% Combed Cotton with vibrant screen print',
      size: 'M - XL',
      sizes: ['M', 'L', 'XL'],
      colour: 'Jet Black',
      colours: ['Jet Black'],
      fabric_gsm: '190 GSM Combed Cotton',
      printing_method: 'Screen Print (Chest & Back)',
      quantity: 50,
      unit_price: 950,
      total_price: 47500
    },
    {
      id: 3,
      quotation: 101,
      product_name: 'Custom Embroidered Sports Cap',
      description: '6-panel heavy brushed cotton twill cap with metal buckle',
      size: 'Free Size',
      sizes: ['Free Size'],
      colour: 'Navy Blue',
      colours: ['Navy Blue'],
      fabric_gsm: 'Brushed Cotton Twill',
      printing_method: '3D Puff Embroidery',
      quantity: 25,
      unit_price: 500,
      total_price: 12500
    }
  ]
};

const mockMashaQuotation: Quotation = {
  ...mockZevoraQuotation,
  id: 102,
  quotation_number: 'QT-2026-0099',
  brand: 2,
  brand_name: 'Masha.Ts',
  customer_name: 'Dilani Perera',
  customer_company: 'Trendz Boutique'
};

const mockInvoice: Invoice = {
  id: 201,
  invoice_number: 'INV-2026-0155',
  brand: 1,
  brand_name: 'Zevora Custom',
  order: 501,
  order_number: 'ORD-2026-0501',
  customer: 12,
  customer_name: 'Kasun Wickramasinghe',
  customer_company: 'Apex Technologies PLC',
  status: 'ISSUED',
  issue_date: '2026-10-15',
  due_date: '2026-10-30',
  subtotal: 185000,
  discount_amount: 5000,
  tax_amount: 0,
  tax_rate_percent: 0,
  delivery_charges: 2500,
  artwork_charges: 0,
  total_amount: 182500,
  paid_amount: 90000,
  balance_due: 92500,
  payment_terms: '50% advance received, balance upon delivery.',
  notes: 'Invoice for custom corporate apparel order.',
  created_at: '2026-10-15T11:00:00Z',
  items: [
    {
      id: 1,
      invoice: 201,
      product_name: 'Custom Corporate Polo T-Shirt',
      description: 'Pique knit fabric with ribbed collar & custom embroidery',
      size: 'S - XXL',
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      colour: 'Navy Blue / Gold Tip',
      colours: ['Navy Blue', 'Gold Tip'],
      fabric_gsm: '220 GSM Pique Cotton',
      printing_method: 'Embroidery (Left Chest)',
      quantity: 100,
      unit_price: 1250,
      total_price: 125000
    }
  ]
};

const zevoraBrand: BrandIdentity = {
  id: 1,
  name: 'Zevora Custom',
  code: 'ZVR'
};

const mashaBrand: BrandIdentity = {
  id: 2,
  name: 'Masha.Ts',
  code: 'MSH'
};

export function DocumentPreviewPage() {
  const [tab, setTab] = useState<'zevora-qt' | 'masha-qt' | 'invoice'>('zevora-qt');
  const paperRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const el = paperRef.current?.firstElementChild as HTMLElement | null;
    if (el) printElement(el, 'Document Preview');
  };

  const handlePdf = () => {
    const el = paperRef.current?.firstElementChild as HTMLElement | null;
    if (el) downloadPdf(el, `preview-${tab}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 text-ink">
      {/* Header bar with controls */}
      <div className="mx-auto max-w-6xl mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2">
          <Button
            variant={tab === 'zevora-qt' ? 'primary' : 'ghost'}
            onClick={() => setTab('zevora-qt')}
          >
            Zevora Quotation (4-Page Template)
          </Button>
          <Button
            variant={tab === 'masha-qt' ? 'primary' : 'ghost'}
            onClick={() => setTab('masha-qt')}
          >
            Masha.Ts Quotation (Standard Layout)
          </Button>
          <Button
            variant={tab === 'invoice' ? 'primary' : 'ghost'}
            onClick={() => setTab('invoice')}
          >
            Invoice (Unchanged Layout)
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button icon={DownloadIcon} onClick={handlePdf}>
            Download PDF
          </Button>
          <Button variant="primary" icon={PrinterIcon} onClick={handlePrint}>
            Print Document
          </Button>
        </div>
      </div>

      {/* Main Document Viewer Container */}
      <div className="mx-auto flex justify-center overflow-x-auto pb-12">
        <div ref={paperRef} className="shadow-2xl">
          {tab === 'zevora-qt' && (
            <QuotationDocument quotation={mockZevoraQuotation} brand={zevoraBrand} />
          )}
          {tab === 'masha-qt' && (
            <QuotationDocument quotation={mockMashaQuotation} brand={mashaBrand} />
          )}
          {tab === 'invoice' && (
            <InvoiceDocument invoice={mockInvoice} brand={zevoraBrand} />
          )}
        </div>
      </div>
    </div>
  );
}
