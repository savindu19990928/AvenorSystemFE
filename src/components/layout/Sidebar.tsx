import React from 'react';
import { NavLink } from 'react-router-dom';
import { navGroups, canAccess } from '../../data/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { cx } from '../../utils/styles';

export function Sidebar({ onNavigate }: {onNavigate?: () => void;}) {
  const { role } = useAuth();
  return (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold">A</div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Avenor</p>
          <p className="text-[11px] text-white/50">Management System</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
        {navGroups.map((group) => {
          const items = group.items.filter((i) => canAccess(i, role));
          if (items.length === 0) return null;
          return (
            <div key={group.label} className="mb-5">
              <p className="px-2 pb-1.5 text-[11px] font-medium text-white/40">{group.label}</p>
              <ul className="space-y-0.5">
                {items.map((item) =>
                <li key={item.to}>
                    <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                    cx(
                      'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors duration-150',
                      isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'
                    )
                    }>
                    
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  </li>
                )}
              </ul>
            </div>);

        })}
      </nav>
      <p className="border-t border-white/10 px-5 py-3 text-[11px] text-white/40">Your Company (Pvt) Ltd</p>
    </div>);

}