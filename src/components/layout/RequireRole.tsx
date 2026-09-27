import React from 'react';
import { LockIcon } from 'lucide-react';
import type { Role } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../data/workflow';

export function RequireRole({ roles, children }: {roles: Role[];children: React.ReactNode;}) {
  const { role } = useAuth();
  if (role && roles.includes(role)) return <>{children}</>;
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <LockIcon className="h-6 w-6 text-faint" aria-hidden="true" />
      <h1 className="mt-3 text-base font-semibold text-ink">This area isn't part of your role</h1>
      <p className="mt-1 max-w-sm text-sm text-muted">
        Available to {roles.map((r) => ROLE_LABELS[r]).join(', ')}. Ask an admin if you need access.
      </p>
    </div>);

}