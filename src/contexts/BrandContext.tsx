import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Brand } from '../types/api';
import { api } from '../utils/api';

interface BrandContextValue {
  brands: Brand[];
  scope: number | null;
  setScope: (id: number | null) => void;
  scopedBrand: Brand | null;
  brandById: (id?: number | null) => Brand | undefined;
}

const STORAGE_KEY = 'avenor.brandScope';
const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({ children }: {children: React.ReactNode;}) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [scope, setScopeState] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Number(stored) : null;
  });

  useEffect(() => {
    api.
    list<Brand>('/api/core/brands/').
    then((list) => setBrands(list.filter((b) => b.is_active !== false))).
    catch(() => setBrands([]));
  }, []);

  const value = useMemo<BrandContextValue>(
    () => ({
      brands,
      scope,
      setScope: (id) => {
        setScopeState(id);
        if (id === null) localStorage.removeItem(STORAGE_KEY);else
        localStorage.setItem(STORAGE_KEY, String(id));
      },
      scopedBrand: brands.find((b) => b.id === scope) ?? null,
      brandById: (id) => brands.find((b) => b.id === id)
    }),
    [brands, scope]
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrands(): BrandContextValue {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrands must be used within BrandProvider');
  return ctx;
}