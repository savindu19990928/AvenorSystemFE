export type CellValue = string | number | null | undefined;
export type CellFormat = 'text' | 'money' | 'number' | 'percent';

export interface ReportColumn {
  header: string;
  format?: CellFormat;
}

export interface ReportSection {
  title?: string;
  columns: ReportColumn[];
  rows: CellValue[][];
  footer?: CellValue[];
  emptyText?: string;
}

export interface ReportSummaryItem {
  label: string;
  value: string;
}

/** One description drives both the printable/PDF report and the CSV export. */
export interface ReportSpec {
  title: string;
  subtitle?: string;
  filename: string;
  summary?: ReportSummaryItem[];
  sections: ReportSection[];
}

export interface BrandIdentity {
  name: string;
  company: string;
  positioning?: string;
  tone: 'premium' | 'standard' | 'neutral';
  code?: string;
  logo?: string;
}

/** A row of the "Order details" table on quotations and invoices. */
export interface CommercialLine {
  description: string;
  details: string[];
  quantity: number;
  sizes: string;
  unit_price?: string | number;
  total_price?: string | number;
}

export interface DocNote {
  label: string;
  text: string;
}

export interface PrintLineItem {
  product_name: string;
  details: string[];
  quantity: number;
  unit_price?: string | number;
  total_price?: string | number;
}

export interface MetaItem {
  label: string;
  value: string;
}

export interface TotalRow {
  label: string;
  value: string | number | undefined;
  kind?: 'deduct' | 'total' | 'due';
  /** Shown instead of the formatted amount, e.g. "To confirm". */
  text?: string;
}