import React, { useState } from 'react';
import { FileSpreadsheetIcon, PrinterIcon } from 'lucide-react';
import type { ReportSpec } from '../../types/print';
import { downloadReportCsv } from '../../utils/csv';
import { useBrandIdentity } from '../../hooks/useBrandIdentity';
import { Button } from '../ui/Button';
import { DocumentViewer } from './DocumentViewer';
import { ReportDocument } from '../documents/ReportDocument';

/** "Export CSV" + "Print / PDF" for any on-screen report, driven by one ReportSpec. */
export function ReportExportActions({ spec, brandId }: {spec: ReportSpec | null;brandId?: number | null;}) {
  const [open, setOpen] = useState(false);
  const brand = useBrandIdentity(brandId);

  return (
    <>
      <Button icon={FileSpreadsheetIcon} disabled={!spec} onClick={() => spec && downloadReportCsv(spec)}>
        Export CSV
      </Button>
      <Button icon={PrinterIcon} disabled={!spec} onClick={() => setOpen(true)}>
        Print / PDF
      </Button>
      <DocumentViewer open={open && !!spec} onClose={() => setOpen(false)} title={spec?.title ?? 'Report'} filename={spec?.filename ?? 'report'}>
        {spec && <ReportDocument spec={spec} brand={brand} />}
      </DocumentViewer>
    </>);

}