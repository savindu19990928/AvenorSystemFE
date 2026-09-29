import type { CropRect } from '../types/documents';

// The uploaded proposal artwork contains all four pages in one image (2 × 2 grid).
// Each rect is a fraction of the full image and becomes one landscape PDF page.
export const quotationTemplate = {
  image: "/quotation.jpg",
  pages: [
  { x: 0, y: 0, w: 0.497, h: 0.495 },
  { x: 0.503, y: 0, w: 0.497, h: 0.495 },
  { x: 0.003, y: 0.501, w: 0.491, h: 0.495 },
  { x: 0.503, y: 0.501, w: 0.494, h: 0.495 }] as
  CropRect[],
  /** Page index (0-based) holding the quotation table. */
  tablePage: 2,
  /** Area on the table page that is replaced with live quotation data (fractions of the page). */
  tableArea: { x: 0.035, y: 0.118, w: 0.93, h: 0.472 } as CropRect,
  /** "Quotation prepared for" box on the cover page (fractions of the page). */
  preparedForArea: { x: 0.553, y: 0.83, w: 0.38, h: 0.085 } as CropRect,
  colors: { ink: '#141414', gold: '#B8924A', line: '#2A2A2A' },
  /** Rendered pixel width of each page before export. */
  renderWidth: 1123
};