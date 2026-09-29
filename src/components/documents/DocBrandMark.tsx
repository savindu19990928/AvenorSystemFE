import React from 'react';
import { documentPalette as P } from '../../data/company';
import { letterFor } from '../../utils/documentModel';

interface DocBrandMarkProps {
  name: string;
  logo: string | null;
  size?: number;
}

/** Brand logo, or the brand's first letter when no logo is available. */
export function DocBrandMark({ name, logo, size = 48 }: DocBrandMarkProps) {
  if (logo) {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <img src={logo} alt="" style={{ maxWidth: size, maxHeight: size, display: 'block' }} />
      </div>);

  }
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: Math.round(size * 0.22),
        background: P.ink,
        color: P.gold,
        fontSize: Math.round(size * 0.48),
        fontWeight: 700,
        lineHeight: `${size}px`,
        textAlign: 'center'
      }}>
      
      {letterFor(name)}
    </div>);

}