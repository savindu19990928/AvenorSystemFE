import { useBrands } from '../contexts/BrandContext';
import { resolveBrandLogo } from '../data/brandLogos';
import { fileUrl } from '../utils/api';
import type { BrandIdentity } from '../types/print';

const HOUSE_NAME = 'Avenor Apparel';

/** Letterhead identity for a document: the brand it was issued under, or the company for cross-brand reports. */
export function useBrandIdentity(brandId?: number | null, brandName?: string | null): BrandIdentity {
  const { brands, brandById } = useBrands();
  const brand = brandById(brandId) ?? brands.find((b) => !!brandName && b.name === brandName);
  const name = brand?.name ?? brandName ?? HOUSE_NAME;
  const hasBrand = !!(brand || brandName);
  const code = brand?.code;

  // If the brand has a remote API logo that isn't already a full URL or data URI, convert it
  const rawApiLogo = brand?.logo
    ? (brand.logo.startsWith('http') || brand.logo.startsWith('data:') ? brand.logo : fileUrl(brand.logo))
    : undefined;

  return {
    name,
    company: brand?.company_name ?? brands[0]?.company_name ?? '',
    positioning: brand?.positioning,
    tone: !hasBrand ? 'neutral' : name.toLowerCase().includes('premium') ? 'premium' : 'standard',
    code,
    logo: resolveBrandLogo(name, code, rawApiLogo)
  };
}