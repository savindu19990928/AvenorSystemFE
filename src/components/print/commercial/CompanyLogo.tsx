import React from 'react';

/** Avenor house mark: a gold "A" with a sweeping crossbar on a deep navy tile. */
export function CompanyLogo({ size = 92, label }: {size?: number;label: string;}) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`${label} logo`} className="block">
      <rect width="100" height="100" fill="#0a1d44" />
      <path d="M53 15 L63 15 L85 85 L72 85 Z" fill="#f4c76f" />
      <path d="M53 15 L58 27 L37 85 L24 85 Z" fill="#f4c76f" />
      <path d="M22 76 C40 62 60 54 82 51 L75 61 C58 62 41 67 22 76 Z" fill="#e8b45a" />
    </svg>);

}