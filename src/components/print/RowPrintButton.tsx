import React from 'react';
import { PrinterIcon } from 'lucide-react';

/** Icon button for table rows that are themselves clickable — never triggers the row action. */
export function RowPrintButton({ label, onClick }: {label: string;onClick: () => void;}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className="rounded-md p-1.5 text-faint transition-colors duration-150 hover:bg-line/60 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
      
      <PrinterIcon className="h-4 w-4" />
    </button>);

}