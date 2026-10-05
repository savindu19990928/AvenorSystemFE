const PRINT_CSS = `
@page { size: A4; margin: 0; }
html, body { background: #ffffff !important; margin: 0; height: auto !important; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.doc-paper { min-height: auto !important; box-shadow: none !important; }
.print-avoid-break { break-inside: avoid; }
`;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
}

function waitForStyles(doc: Document): Promise<void> {
  const links = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
  const loads = links.map((l) => new Promise<void>((res) => {
    if (l.sheet) return res();
    l.addEventListener('load', () => res(), { once: true });
    l.addEventListener('error', () => res(), { once: true });
  }));
  const timeout = new Promise<void>((res) => setTimeout(res, 1500));
  return Promise.race([Promise.all(loads).then(() => undefined), timeout]);
}

/** Prints a single element on its own, using the app's styles, via a hidden iframe. */
export async function printElement(el: HTMLElement, title: string): Promise<void> {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    throw new Error('Print frame unavailable');
  }
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).
  map((n) => n.outerHTML).
  join('');
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>${styles}<style>${PRINT_CSS}</style></head><body>${el.outerHTML}</body></html>`);
  doc.close();
  await waitForStyles(doc);
  await (doc as Document & {fonts?: FontFaceSet;}).fonts?.ready;
  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  win.addEventListener('afterprint', cleanup, { once: true });
  win.focus();
  win.print();
  setTimeout(() => iframe.isConnected && iframe.remove(), 60000);
}

/** Renders an element to an A4 PDF (multi-page when taller than one sheet) and downloads it. */
export async function downloadPdf(el: HTMLElement, filename: string): Promise<void> {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-10000px;top:0;background:#ffffff;';
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.boxShadow = 'none';
  holder.appendChild(clone);
  document.body.appendChild(holder);
  try {
    await document.fonts?.ready;
    const canvas = await html2canvas(clone, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = 210;
    const pageH = 297;
    const imgH = canvas.height * pageW / canvas.width;
    const img = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(img, 'JPEG', 0, 0, pageW, imgH);
    let offset = pageH;
    while (imgH - offset > 0.5) {
      pdf.addPage();
      pdf.addImage(img, 'JPEG', 0, -offset, pageW, imgH);
      offset += pageH;
    }
    pdf.save(filename);
  } finally {
    holder.remove();
  }
}

export function safeFilename(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'document';
}