function getPrintCss(isLandscape: boolean): string {
  const pageRule = isLandscape ? 'size: A4 landscape;' : 'size: A4 portrait;';
  const pageW = isLandscape ? '297mm' : '210mm';
  const pageH = isLandscape ? '210mm' : '297mm';
  return `
@page { ${pageRule} margin: 0; }
html, body {
  background: #ffffff !important;
  margin: 0 !important;
  padding: 0 !important;
  width: ${pageW} !important;
  height: auto !important;
}
* {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  box-sizing: border-box;
}
.doc-paper {
  min-height: auto !important;
  box-shadow: none !important;
}
.print-avoid-break {
  break-inside: avoid;
  page-break-inside: avoid;
}
.doc-page {
  page-break-after: always !important;
  break-after: page !important;
  page-break-inside: avoid !important;
  break-inside: avoid !important;
  width: ${pageW} !important;
  height: ${pageH} !important;
  max-width: ${pageW} !important;
  max-height: ${pageH} !important;
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}
.doc-page:last-child {
  page-break-after: avoid !important;
  break-after: avoid !important;
}
`;
}

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
  const isLandscape =
    el.getAttribute('data-orientation') === 'landscape' ||
    !!el.querySelector('[data-orientation="landscape"]');
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
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>${styles}<style>${getPrintCss(isLandscape)}</style></head><body>${el.outerHTML}</body></html>`);
  doc.close();
  await waitForStyles(doc);
  await (doc as Document & {fonts?: FontFaceSet;}).fonts?.ready;
  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  win.addEventListener('afterprint', cleanup, { once: true });
  win.focus();
  win.print();
  setTimeout(() => iframe.isConnected && iframe.remove(), 60000);
}

/** Renders an element to an A4 PDF (multi-page when taller than one sheet or multi-page elements) and downloads it. */
export async function downloadPdf(el: HTMLElement, filename: string): Promise<void> {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-10000px;top:0;background:#ffffff;';
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.boxShadow = 'none';
  holder.appendChild(clone);
  document.body.appendChild(holder);

  // Neutralize unsupported oklab/oklch colors for html2canvas
  const origGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;
  CSSStyleDeclaration.prototype.getPropertyValue = function (property: string) {
    const val = origGetPropertyValue.call(this, property);
    if (val && typeof val === 'string' && (val.includes('oklab') || val.includes('oklch'))) {
      return 'rgba(0, 0, 0, 0)';
    }
    return val;
  };

  try {
    await document.fonts?.ready;
    const isLandscape =
      clone.getAttribute('data-orientation') === 'landscape' ||
      !!clone.querySelector('[data-orientation="landscape"]');
    const pageEls = clone.querySelectorAll<HTMLElement>('[data-doc-page]');

    if (pageEls.length > 0) {
      const orientation = isLandscape ? 'landscape' : 'portrait';
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation });
      const pdfW = isLandscape ? 297 : 210;
      const pdfH = isLandscape ? 210 : 297;

      for (let i = 0; i < pageEls.length; i++) {
        const pageEl = pageEls[i];
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false
        });
        const img = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) {
          pdf.addPage('a4', orientation);
        }
        pdf.addImage(img, 'JPEG', 0, 0, pdfW, pdfH);
      }
      pdf.save(filename);
      return;
    }

    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false
    });
    const orientation = isLandscape ? 'landscape' : 'portrait';
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation });
    const pageW = isLandscape ? 297 : 210;
    const pageH = isLandscape ? 210 : 297;
    const imgH = (canvas.height * pageW) / canvas.width;
    const img = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(img, 'JPEG', 0, 0, pageW, imgH);
    let offset = pageH;
    while (imgH - offset > 0.5) {
      pdf.addPage('a4', orientation);
      pdf.addImage(img, 'JPEG', 0, -offset, pageW, imgH);
      offset += pageH;
    }
    pdf.save(filename);
  } finally {
    CSSStyleDeclaration.prototype.getPropertyValue = origGetPropertyValue;
    holder.remove();
  }
}

export function safeFilename(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'document';
}