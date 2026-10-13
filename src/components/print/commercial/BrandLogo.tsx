import React, { useState } from 'react';

interface BrandLogoProps {
  name: string;
  code?: string;
  logo?: string;
  /** Kept well below the company mark so the house identity always leads. */
  size?: number;
}

function initials(name: string, code?: string): string {
  if (code && code.length <= 3) return code.toUpperCase();
  const words = name.split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words.slice(0, 2).map((w) => w[0]) : [name.slice(0, 2)]).join('').toUpperCase();
}

export function BrandLogo({ name, code, logo, size = 44 }: BrandLogoProps) {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);

  const isFailed = failedLogo === logo;

  if (logo && !isFailed) {
    const isRemote = /^https?:\/\//i.test(logo);
    return (
      <img
        src={logo}
        alt={`${name} logo`}
        crossOrigin={isRemote ? 'anonymous' : undefined}
        onError={() => setFailedLogo(logo)}
        height={size}
        className="block shrink-0 object-contain"
        style={{ height: size, width: 'auto', maxWidth: size * 2.5 }}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`${name} logo`}
      className="flex shrink-0 flex-col items-center justify-center border-[1.5px] border-doc-navy bg-white text-doc-navy"
      style={{ width: size, height: size }}
    >
      <span className="text-[14px] font-bold leading-none tracking-wide">{initials(name, code)}</span>
      <span className="mt-1 h-[2px] w-4 bg-doc-gold" />
    </div>
  );
}