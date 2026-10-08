import React from 'react';

export function DocLabel({ children }: {children: React.ReactNode;}) {
  return <p className="text-[11px] font-bold uppercase tracking-wide text-doc-goldink">{children}</p>;
}