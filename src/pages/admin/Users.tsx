import React, { useState } from 'react';
import { UserPlusIcon } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAction } from '../../hooks/useAction';
import { useDebounce } from '../../hooks/useDebounce';
import { api } from '../../utils/api';
import type { StaffUser } from '../../types/api';
import { formatDate } from '../../utils/format';
import { ROLES, ROLE_LABELS } from '../../data/workflow';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { SearchInput } from '../../components/ui/SearchInput';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { UserFormModal } from '../../components/users/UserFormModal';
import { inputClass } from '../../utils/styles';

const ACCESS: Record<string, string> = {
  ADMIN: 'Full system access and approvals',
  SALES: 'Customers, inquiries, quotations and orders',
  PRODUCTION: 'Production stages and quantities',
  STORE_KEEPER: 'Inventory and stock movements',
  ACCOUNTS: 'Invoices, payments and financial reports',
  DELIVERY: 'Delivery status and tracking'
};

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [editing, setEditing] = useState<StaffUser | null | 'new'>(null);
  const [deactivating, setDeactivating] = useState<StaffUser | null>(null);
  const q = useDebounce(search);
  const { data, loading, error, reload } = useApi(() => api.list<StaffUser>('/api/core/users/', { search: q, user_type: role }), [q, role]);
  const { run, pending } = useAction();

  const deactivate = async () => {
    if (!deactivating) return;
    const res = await run(() => api.del(`/api/core/users/${deactivating.id}/`), 'Account deactivated');
    if (res !== undefined) {
      setDeactivating(null);
      reload();
    }
  };

  return (
    <div>
      <PageHeader
        title="Staff & roles"
        description="Six roles control what each person can see and which order stages they can move."
        actions={<Button variant="primary" icon={UserPlusIcon} onClick={() => setEditing('new')}>New account</Button>} />
      
      <Panel flush>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search username, name, email or phone" className="flex-1" />
          <select aria-label="Role" className={`${inputClass} sm:w-48`} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        <DataTable
          rows={data}
          loading={loading}
          error={error}
          onRetry={reload}
          getRowKey={(u) => u.id}
          onRowClick={(u) => setEditing(u)}
          rowClassName={(u) => u.is_active ? '' : 'opacity-50'}
          emptyTitle="No staff accounts"
          columns={[
          {
            key: 'name',
            header: 'Staff member',
            render: (u) =>
            <div>
                  <p className="font-medium">{`${u.first_name} ${u.last_name}`.trim() || u.username}</p>
                  <p className="text-xs text-muted">@{u.username} · {u.email}</p>
                </div>

          },
          {
            key: 'role',
            header: 'Role',
            render: (u) =>
            <div>
                  <p>{ROLE_LABELS[u.user_type] ?? u.user_type}</p>
                  <p className="text-xs text-faint">{ACCESS[u.user_type]}</p>
                </div>

          },
          { key: 'dept', header: 'Department', render: (u) => <span className="text-muted">{u.department || '—'}</span> },
          { key: 'joined', header: 'Joined', render: (u) => <span className="text-muted">{formatDate(u.date_joined)}</span> },
          { key: 'status', header: 'Status', render: (u) => <span className={u.is_active ? 'text-ok' : 'text-faint'}>{u.is_active ? 'Active' : 'Inactive'}</span> },
          {
            key: 'act',
            header: '',
            align: 'right',
            render: (u) =>
            u.is_active ?
            <span onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => setDeactivating(u)}>Deactivate</Button>
                  </span> :
            null
          }]
          } />
        
      </Panel>
      <UserFormModal open={editing !== null} user={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onDone={() => {setEditing(null);reload();}} />
      <ConfirmDialog
        open={!!deactivating}
        onClose={() => setDeactivating(null)}
        onConfirm={deactivate}
        pending={pending}
        danger
        title={`Deactivate ${deactivating?.username ?? ''}?`}
        message="They won't be able to sign in. Their past actions stay in the audit log."
        confirmLabel="Deactivate" />
      
    </div>);

}