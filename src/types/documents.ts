export type DocumentKind = 'QUOTATION' | 'INVOICE';
export type QuotationLayout = 'full' | 'template';
export type ExportAction = 'download' | 'print';

export interface DocParty {
  name: string;
  contact?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
}

export interface DocBrand {
  name: string;
  positioning?: string;
  /** Data URL of the brand logo, or null to render the first-letter mark. */
  logo: string | null;
}

export interface DocLine {
  description: string;
  spec: string;
  size: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface DocAmount {
  label: string;
  amount: number;
}

export interface PrintableDocument {
  kind: DocumentKind;
  number: string;
  issueDate: string;
  dueLabel: string;
  dueDate: string;
  reference?: DocAmountLabel;
  billTo: DocParty;
  brand: DocBrand;
  lines: DocLine[];
  subtotal: number;
  charges: DocAmount[];
  discount: number;
  tax: DocAmount;
  total: number;
  paid?: number;
  balance?: number;
  paymentTerms?: string;
  notes?: string;
}

export interface DocAmountLabel {
  label: string;
  value: string;
}

export interface DocPageSlice {
  lines: DocLine[];
  startIndex: number;
}

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type RenderJob =
{layout: 'full';doc: PrintableDocument;companyLogo: string | null;pages: DocPageSlice[];} |
{layout: 'template';doc: PrintableDocument;pages: string[];width: number;height: number;};