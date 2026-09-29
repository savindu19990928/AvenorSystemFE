import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { jsPDF } from 'jspdf';
import type { Brand, Customer, Invoice, OrderDetail, Quotation } from '../types/api';
import type { DocBrand, ExportAction, PrintableDocument, QuotationLayout, RenderJob } from '../types/documents';
import { useBrands } from '../contexts/BrandContext';
import { api, errorMessage, fileUrl } from '../utils/api';
import { cropImage, loadImage, nodesToPdf, printPdf, toDataUrl } from '../utils/pdf';
import { documentFilename, invoiceToDocument, paginateLines, quotationToDocument } from '../utils/documentModel';
import { company } from '../data/company';
import { quotationTemplate } from '../data/quotationTemplate';

const A4_PT = { width: 595.28, height: 841.89 };
const TEMPLATE_PT_WIDTH = 842;

export interface ExportBusy {
  key: string;
  action: ExportAction;
}

export function useDocumentExport() {
  const { brandById } = useBrands();
  const [busy, setBusy] = useState<ExportBusy | null>(null);
  const [job, setJob] = useState<RenderJob | null>(null);
  const resolver = useRef<((pages: HTMLElement[]) => void) | null>(null);

  const onReady = useCallback((pages: HTMLElement[]) => {
    resolver.current?.(pages);
    resolver.current = null;
  }, []);

  const renderJob = (next: RenderJob) =>
  new Promise<HTMLElement[]>((resolve) => {
    resolver.current = resolve;
    setJob(next);
  });

  const resolveBrand = async (id?: number | null, fallbackName?: string): Promise<DocBrand> => {
    let brand: Brand | undefined = brandById(id);
    if (id && !brand?.logo) {
      brand = (await api.get<Brand>(`/api/core/brands/${id}/`).catch(() => undefined)) ?? brand;
    }
    const logo = brand?.logo ? await toDataUrl(fileUrl(brand.logo)) : null;
    return { name: brand?.name ?? fallbackName ?? 'Brand', positioning: brand?.positioning, logo };
  };

  const fetchCustomer = (id?: number | null) =>
  id ? api.get<Customer>(`/api/customers/customers/${id}/`).catch(() => null) : Promise.resolve(null);

  const buildFull = async (doc: PrintableDocument): Promise<jsPDF> => {
    const companyLogo = await toDataUrl(company.logo);
    const pages = await renderJob({ layout: 'full', doc, companyLogo, pages: paginateLines(doc.lines) });
    return nodesToPdf(pages, { ...A4_PT, orientation: 'portrait' });
  };

  const buildTemplate = async (doc: PrintableDocument): Promise<jsPDF> => {
    const src = await toDataUrl(quotationTemplate.image);
    if (!src) throw new Error("Couldn't load the quotation template artwork. Check your connection and try again.");
    const img = await loadImage(src);
    const crops = quotationTemplate.pages.map((r) => cropImage(img, r));
    const first = quotationTemplate.pages[0];
    const width = quotationTemplate.renderWidth;
    const height = Math.round(width * (first.h * img.naturalHeight) / (first.w * img.naturalWidth));
    const pages = await renderJob({ layout: 'template', doc, pages: crops, width, height });
    return nodesToPdf(pages, { width: TEMPLATE_PT_WIDTH, height: TEMPLATE_PT_WIDTH * height / width, orientation: 'landscape' });
  };

  const execute = async (key: string, action: ExportAction, work: () => Promise<{pdf: jsPDF;filename: string;}>) => {
    if (busy) return;
    setBusy({ key, action });
    try {
      const { pdf, filename } = await work();
      if (action === 'download') {
        pdf.save(filename);
        toast.success('PDF downloaded');
      } else {
        printPdf(pdf);
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      resolver.current = null;
      setJob(null);
      setBusy(null);
    }
  };

  const exportQuotation = (quotation: Quotation, layout: QuotationLayout, action: ExportAction) =>
  execute(quotation.quotation_number, action, async () => {
    const [customer, brand] = await Promise.all([fetchCustomer(quotation.customer), resolveBrand(quotation.brand, quotation.brand_name)]);
    const doc = quotationToDocument(quotation, customer, brand);
    const pdf = layout === 'full' ? await buildFull(doc) : await buildTemplate(doc);
    return { pdf, filename: documentFilename(doc, layout === 'template' ? '-Proposal' : '') };
  });

  const exportInvoice = (invoice: Invoice, action: ExportAction) =>
  execute(invoice.invoice_number, action, async () => {
    const full = invoice.id ? await api.get<Invoice>(`/api/billing/invoices/${invoice.id}/`).catch(() => invoice) : invoice;
    if (!full.order) throw new Error('This invoice is not linked to an order, so its line items are unavailable.');
    const order = await api.get<OrderDetail>(`/api/orders/orders/${full.order}/`);
    const [customer, brand] = await Promise.all([fetchCustomer(order.customer), resolveBrand(order.brand, full.brand_name ?? order.brand_name)]);
    const doc = invoiceToDocument(full, order, customer, brand);
    return { pdf: await buildFull(doc), filename: documentFilename(doc) };
  });

  return { exportQuotation, exportInvoice, busy, stageProps: { job, onReady } };
}