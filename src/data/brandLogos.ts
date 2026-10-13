import zevoraLogo from '../assets/brands/logo1.png?inline';
import mashaLogo from '../assets/brands/logo2.png?inline';

export interface BrandLogoEntry {
  match: string;
  logo: string;
}

/** Uploaded brand marks, matched against the brand name or code returned by the API. */
export const brandLogos: BrandLogoEntry[] = [
  { match: 'zevora', logo: zevoraLogo },
  { match: 'zvr', logo: zevoraLogo },
  { match: 'masha', logo: mashaLogo },
  { match: 'masha.ts', logo: mashaLogo }
];

/**
 * Resolves a brand logo by checking:
 * 1. Matching known names or codes against brand marks.
 * 2. Static paths like '/logo1.png' or '/logo2.png'.
 * 3. Fallback to API-provided logo URL.
 */
export function resolveBrandLogo(name?: string | null, code?: string | null, apiLogo?: string | null): string | undefined {
  const query = `${name ?? ''} ${code ?? ''}`.toLowerCase();
  const matched = brandLogos.find((b) => query.includes(b.match))?.logo;
  if (matched) return matched;

  if (apiLogo) {
    const clean = apiLogo.trim();
    if (clean === '/logo1.png' || clean === 'logo1.png' || clean === './logo1.png') return zevoraLogo;
    if (clean === '/logo2.png' || clean === 'logo2.png' || clean === './logo2.png') return mashaLogo;
    return clean;
  }

  return undefined;
}