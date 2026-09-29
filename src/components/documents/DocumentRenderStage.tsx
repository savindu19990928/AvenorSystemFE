import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { RenderJob } from '../../types/documents';
import { quotationTemplate } from '../../data/quotationTemplate';
import { waitForAssets } from '../../utils/pdf';
import { FullDocumentPage } from './FullDocumentPage';
import { TemplatePage } from './TemplatePage';
import { TemplateQuotationTable } from './TemplateQuotationTable';
import { TemplatePreparedFor } from './TemplatePreparedFor';

export interface DocumentRenderStageProps {
  job: RenderJob | null;
  onReady: (pages: HTMLElement[]) => void;
}

/** Renders document pages off-screen so they can be captured into a PDF. */
export function DocumentRenderStage({ job, onReady }: DocumentRenderStageProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!job || !root) return;
    let cancelled = false;
    waitForAssets(root).then(() => {
      if (!cancelled) onReady(Array.from(root.children) as HTMLElement[]);
    });
    return () => {
      cancelled = true;
    };
  }, [job, onReady]);

  if (!job) return null;

  return createPortal(
    <div ref={ref} aria-hidden="true" style={{ position: 'absolute', left: -12000, top: 0, pointerEvents: 'none' }}>
      {job.layout === 'full' ?
      job.pages.map((slice, i) =>
      <FullDocumentPage key={i} doc={job.doc} companyLogo={job.companyLogo} slice={slice} pageIndex={i} pageCount={job.pages.length} />
      ) :
      job.pages.map((src, i) =>
      <TemplatePage key={i} image={src} width={job.width} height={job.height}>
              {i === 0 && <TemplatePreparedFor doc={job.doc} pageWidth={job.width} pageHeight={job.height} />}
              {i === quotationTemplate.tablePage && <TemplateQuotationTable doc={job.doc} pageWidth={job.width} pageHeight={job.height} />}
            </TemplatePage>
      )}
    </div>,
    document.body
  );
}