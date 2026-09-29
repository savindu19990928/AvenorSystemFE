import React from 'react';

interface TemplatePageProps {
  image: string;
  width: number;
  height: number;
  children?: React.ReactNode;
}

/** One page of the uploaded proposal artwork, with optional live-data overlays. */
export function TemplatePage({ image, width, height, children }: TemplatePageProps) {
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', background: '#ffffff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <img src={image} alt="" style={{ position: 'absolute', left: 0, top: 0, width, height, display: 'block' }} />
      {children}
    </div>);

}