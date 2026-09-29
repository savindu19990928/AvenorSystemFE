import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { CropRect } from '../types/documents';

/** Fetch an image and return it as a data URL so it can be drawn without tainting the canvas. */
export async function toDataUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/')) return null;
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image failed to load.'));
    img.src = src;
  });
}

export function cropImage(img: HTMLImageElement, rect: CropRect): string {
  const sx = Math.round(rect.x * img.naturalWidth);
  const sy = Math.round(rect.y * img.naturalHeight);
  const sw = Math.round(rect.w * img.naturalWidth);
  const sh = Math.round(rect.h * img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not prepare the document.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas.toDataURL('image/jpeg', 0.95);
}

export async function waitForAssets(root: HTMLElement): Promise<void> {
  if (document.fonts?.ready) await document.fonts.ready;
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    images.map((img) =>
    img.complete ?
    Promise.resolve() :
    new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    })
    )
  );
  await new Promise((r) => requestAnimationFrame(() => r(null)));
}

interface PdfPageSize {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
}

/** Rasterise each page node and place it on its own PDF page (units: pt). */
export async function nodesToPdf(nodes: HTMLElement[], size: PdfPageSize): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: size.orientation, unit: 'pt', format: [size.width, size.height], compress: true });
  for (let i = 0; i < nodes.length; i += 1) {
    const canvas = await html2canvas(nodes[i], { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
    if (i > 0) pdf.addPage([size.width, size.height], size.orientation);
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, size.width, size.height, undefined, 'FAST');
  }
  return pdf;
}

export function printPdf(pdf: jsPDF): void {
  const url = URL.createObjectURL(pdf.output('blob'));
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  iframe.src = url;
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.open(url, '_blank', 'noopener');
    }
    window.setTimeout(() => {
      iframe.remove();
      URL.revokeObjectURL(url);
    }, 60000);
  };
  document.body.appendChild(iframe);
}