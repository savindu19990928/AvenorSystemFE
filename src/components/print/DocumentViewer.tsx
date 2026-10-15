import React, { useRef, useState } from 'react';
import { DownloadIcon, PrinterIcon } from 'lucide-react';
import { toast } from 'sonner';
import { downloadPdf, printElement, safeFilename } from '../../utils/print';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StateMessage } from '../ui/StateMessage';

interface DocumentViewerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  filename: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  children?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl';
}

export function DocumentViewer({ open, onClose, title, filename, loading, error, onRetry, children, size = 'xl' }: DocumentViewerProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<'pdf' | 'print' | null>(null);
  const ready = !loading && !error && !!children;

  const run = async (kind: 'pdf' | 'print') => {
    const el = paperRef.current?.firstElementChild as HTMLElement | null;
    if (!el) return;
    setBusy(kind);
    try {
      if (kind === 'pdf') {
        await downloadPdf(el, `${safeFilename(filename)}.pdf`);
        toast.success('PDF downloaded');
      } else {
        await printElement(el, title);
      }
    } catch {
      toast.error(kind === 'pdf' ? 'Could not create the PDF. Use Print and choose "Save as PDF" instead.' : 'Could not open the print dialog.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size={size}
      title={title}
      description="Preview of the A4 document"
      footer={
      <>
          <Button icon={DownloadIcon} loading={busy === 'pdf'} disabled={!ready || busy !== null} onClick={() => run('pdf')}>
            Download PDF
          </Button>
          <Button variant="primary" icon={PrinterIcon} loading={busy === 'print'} disabled={!ready || busy !== null} onClick={() => run('print')}>
            Print
          </Button>
        </>
      }>
      
      {loading ?
      <StateMessage kind="loading" title="Preparing document…" /> :
      error ?
      <StateMessage kind="error" message={error} onRetry={onRetry} /> :

      <div className="-mx-6 -my-5 overflow-x-auto bg-canvas px-6 py-6">
          <div ref={paperRef} className="mx-auto w-fit shadow-pop">
            {children}
          </div>
        </div>
      }
    </Modal>);

}