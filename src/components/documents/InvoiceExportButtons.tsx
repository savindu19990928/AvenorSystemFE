import React from 'react';
import { DownloadIcon, PrinterIcon } from 'lucide-react';
import type { Invoice } from '../../types/api';
import type { ExportAction } from '../../types/documents';
import type { ExportBusy } from '../../hooks/useDocumentExport';
import { Button } from '../ui/Button';

interface InvoiceExportButtonsProps {
  invoice: Invoice;
  busy: ExportBusy | null;
  onExport: (invoice: Invoice, action: ExportAction) => void;
}

export function InvoiceExportButtons({ invoice, busy, onExport }: InvoiceExportButtonsProps) {
  const mine = busy?.key === invoice.invoice_number ? busy.action : null;
  const stop = (e: React.MouseEvent | React.KeyboardEvent) => e.stopPropagation();
  return (
    <div className="inline-flex items-center gap-0.5" onClick={stop} onKeyDown={stop}>
      <Button
        size="sm"
        variant="ghost"
        icon={DownloadIcon}
        loading={mine === 'download'}
        disabled={!!busy}
        onClick={() => onExport(invoice, 'download')}
        aria-label={`Download ${invoice.invoice_number} as PDF`}
        title="Download PDF" />
      
      <Button
        size="sm"
        variant="ghost"
        icon={PrinterIcon}
        loading={mine === 'print'}
        disabled={!!busy}
        onClick={() => onExport(invoice, 'print')}
        aria-label={`Print ${invoice.invoice_number}`}
        title="Print" />
      
    </div>);

}