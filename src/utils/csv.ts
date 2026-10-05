import type { CellFormat, CellValue, ReportSpec } from '../types/print';
import { toNumber } from './format';

function raw(v: CellValue, fmt?: CellFormat): string {
  if (v === null || v === undefined) return '';
  if (fmt === 'money') return toNumber(v).toFixed(2);
  if (fmt === 'number' || fmt === 'percent') return String(toNumber(v));
  return String(v);
}

function escapeCell(s: string): string {
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function reportToCsv(spec: ReportSpec): string {
  const lines: string[][] = [[spec.title]];
  if (spec.subtitle) lines.push([spec.subtitle]);
  spec.summary?.forEach((s) => lines.push([s.label, s.value]));
  spec.sections.forEach((sec) => {
    lines.push([]);
    if (sec.title) lines.push([sec.title]);
    lines.push(sec.columns.map((c) => c.header));
    sec.rows.forEach((r) => lines.push(r.map((v, i) => raw(v, sec.columns[i]?.format))));
    if (sec.footer) lines.push(sec.footer.map((v, i) => raw(v, sec.columns[i]?.format)));
  });
  return lines.map((l) => l.map(escapeCell).join(',')).join('\r\n');
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadReportCsv(spec: ReportSpec): void {
  // BOM so Excel opens UTF-8 (e.g. "Rs.", "–") correctly.
  saveBlob(new Blob(['\ufeff' + reportToCsv(spec)], { type: 'text/csv;charset=utf-8' }), `${spec.filename}.csv`);
}