import React, { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBrands } from '../../contexts/BrandContext';
import { useApi } from '../../hooks/useApi';
import { api } from '../../utils/api';
import type { Product } from '../../types/api';
import { formatMoney, humanize } from '../../utils/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { StateMessage } from '../../components/ui/StateMessage';
import { isPremium } from '../../components/ui/BrandTag';
import { ProductFormModal } from '../../components/catalog/ProductFormModal';
import { SpecFormModal } from '../../components/catalog/SpecFormModal';
import { cx } from '../../utils/styles';

export function CatalogPage() {
  const { hasRole } = useAuth();
  const { brands, scope } = useBrands();
  const isAdmin = hasRole('ADMIN');
  const [creating, setCreating] = useState(false);
  const [specFor, setSpecFor] = useState<Product | null>(null);
  const { data, loading, error, reload } = useApi(() => api.list<Product>('/api/catalog/products/'), []);
  const visibleBrands = brands.filter((b) => !scope || b.id === scope);

  return (
    <div>
      <PageHeader
        title="Product catalogue"
        description="Each brand keeps its own products, specifications and base prices. Quotations and orders only offer the selected brand's products."
        actions={isAdmin && <Button variant="primary" icon={PlusIcon} onClick={() => setCreating(true)}>New product</Button>} />
      
      {loading && !data ?
      <StateMessage kind="loading" /> :
      error ?
      <StateMessage kind="error" message={error} onRetry={reload} /> :

      <div className={cx('grid gap-6', visibleBrands.length > 1 && 'lg:grid-cols-2')}>
          {visibleBrands.map((b) => {
          const products = (data ?? []).filter((p) => p.brand === b.id);
          const premium = isPremium(b.name);
          return (
            <section key={b.id} className="rounded-xl border border-line bg-surface">
                <header className={cx('rounded-t-xl border-b px-5 py-4', premium ? 'border-premium/20 bg-premium-soft' : 'border-standard/20 bg-standard-soft')}>
                  <h2 className={cx('text-base font-semibold', premium ? 'text-premium' : 'text-standard')}>{b.name}</h2>
                  <p className="text-xs text-muted">{b.positioning}</p>
                </header>
                {products.length === 0 ?
              <StateMessage kind="empty" title="No products yet" /> :

              <ul className="divide-y divide-line">
                    {products.map((p) =>
                <li key={p.id} className="flex items-start gap-4 px-5 py-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-ink">{p.name}</p>
                            {!p.is_active && <span className="rounded bg-canvas px-1.5 text-[11px] text-faint">Inactive</span>}
                          </div>
                          <p className="mt-0.5 font-mono text-xs text-faint">{p.code}</p>
                          <p className="mt-1 text-sm text-muted">{[humanize(p.product_type), p.default_gsm, p.fabric_composition].filter(Boolean).join(' · ')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums">{formatMoney(p.base_price)}</p>
                          <p className="text-[11px] text-faint">base / pc</p>
                          {isAdmin &&
                    <button type="button" onClick={() => setSpecFor(p)} className="mt-1 text-xs font-medium text-accent hover:underline">
                              Add variant
                            </button>
                    }
                        </div>
                      </li>
                )}
                  </ul>
              }
              </section>);

        })}
        </div>
      }
      <ProductFormModal open={creating} defaultBrand={scope} onClose={() => setCreating(false)} onDone={() => {setCreating(false);reload();}} />
      <SpecFormModal product={specFor} onClose={() => setSpecFor(null)} onDone={() => setSpecFor(null)} />
    </div>);

}