import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellIcon, LogOutIcon, MenuIcon, SearchIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBrands } from '../../contexts/BrandContext';
import type { AppNotification } from '../../types/api';
import { api } from '../../utils/api';
import { ROLE_LABELS } from '../../data/workflow';
import { cx } from '../../utils/styles';

export function Topbar({ onMenu }: {onMenu: () => void;}) {
  const { user, role, logout } = useAuth();
  const { brands, scope, setScope } = useBrands();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () =>
    api.
    list<AppNotification>('/api/core/notifications/', { is_read: false }).
    then((list) => active && setUnread(list.length)).
    catch(() => undefined);
    load();
    const t = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/orders?search=${encodeURIComponent(q)}`);
  };

  const scopes: {id: number | null;label: string;}[] = [{ id: null, label: 'All brands' }, ...brands.map((b) => ({ id: b.id, label: b.name.replace(/ Brand$/, '') }))];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur lg:px-6">
      <button type="button" onClick={onMenu} className="rounded-md p-1.5 text-muted hover:bg-canvas lg:hidden" aria-label="Open menu">
        <MenuIcon className="h-5 w-5" />
      </button>

      <form onSubmit={submit} className="relative hidden max-w-sm flex-1 sm:block" role="search">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find order by ID, e.g. ORD-2026-000125"
          aria-label="Find order"
          className="h-9 w-full rounded-lg border border-line bg-canvas pl-9 pr-3 text-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-faint focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20" />
        
      </form>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center rounded-lg border border-line bg-canvas p-0.5 md:flex" role="radiogroup" aria-label="Brand scope">
          {scopes.map((s) =>
          <button
            key={s.label}
            type="button"
            role="radio"
            aria-checked={scope === s.id}
            onClick={() => setScope(s.id)}
            className={cx(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150',
              scope === s.id ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
            )}>
            
              {s.label}
            </button>
          )}
        </div>

        <Link to="/notifications" className="relative rounded-md p-2 text-muted transition-colors duration-150 hover:bg-canvas hover:text-ink" aria-label={`Notifications, ${unread} unread`}>
          <BellIcon className="h-5 w-5" />
          {unread > 0 &&
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          }
        </Link>

        <div className="flex items-center gap-2.5 border-l border-line pl-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-medium text-ink">{user ? `${user.first_name} ${user.last_name}`.trim() || user.username : ''}</p>
            <p className="text-xs text-muted">{role ? ROLE_LABELS[role] : ''}</p>
          </div>
          <button type="button" onClick={logout} className="rounded-md p-2 text-muted transition-colors duration-150 hover:bg-canvas hover:text-ink" aria-label="Sign out">
            <LogOutIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>);

}