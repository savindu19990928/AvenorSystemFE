import React, { useEffect, useState } from 'react';
import type { Role, StaffUser } from '../../types/api';
import { api } from '../../utils/api';
import { useAction } from '../../hooks/useAction';
import { ROLES, ROLE_LABELS } from '../../data/workflow';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { inputClass } from '../../utils/styles';

const empty = { username: '', password: '', email: '', first_name: '', last_name: '', user_type: 'SALES' as Role, department: '', phone: '' };

export function UserFormModal({ open, user, onClose, onDone }: {open: boolean;user?: StaffUser | null;onClose: () => void;onDone: () => void;}) {
  const [form, setForm] = useState(empty);
  const { run, pending, fieldErrors } = useAction();

  useEffect(() => {
    if (!open) return;
    setForm(
      user ?
      { username: user.username, password: '', email: user.email, first_name: user.first_name, last_name: user.last_name, user_type: user.user_type, department: user.department ?? '', phone: user.phone ?? '' } :
      empty
    );
  }, [open, user]);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { password, username, ...rest } = form;
    const res = user ?
    await run(() => api.patch(`/api/core/users/${user.id}/`, { ...rest, ...(password ? { password } : {}) }), 'Staff account updated') :
    await run(() => api.post('/api/core/users/', form), 'Staff account created');
    if (res !== undefined) onDone();
    void username;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={user ? `Edit ${user.username}` : 'New staff account'}
      description="The role decides which modules and order stages this person can work on."
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="user-form" loading={pending}>{user ? 'Save changes' : 'Create account'}</Button>
        </>
      }>
      
      <form id="user-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Username" htmlFor="u-username" required error={fieldErrors.username}>
          <input id="u-username" required disabled={!!user} className={inputClass} value={form.username} onChange={set('username')} />
        </Field>
        <Field label={user ? 'New password' : 'Password'} htmlFor="u-pass" required={!user} hint={user ? 'Leave blank to keep the current password.' : undefined} error={fieldErrors.password}>
          <input id="u-pass" type="password" autoComplete="new-password" required={!user} className={inputClass} value={form.password} onChange={set('password')} />
        </Field>
        <Field label="First name" htmlFor="u-first">
          <input id="u-first" className={inputClass} value={form.first_name} onChange={set('first_name')} />
        </Field>
        <Field label="Last name" htmlFor="u-last">
          <input id="u-last" className={inputClass} value={form.last_name} onChange={set('last_name')} />
        </Field>
        <Field label="Email" htmlFor="u-email" error={fieldErrors.email}>
          <input id="u-email" type="email" className={inputClass} value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Phone" htmlFor="u-phone">
          <input id="u-phone" className={inputClass} value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label="Role" htmlFor="u-role" required>
          <select id="u-role" className={inputClass} value={form.user_type} onChange={set('user_type')}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </Field>
        <Field label="Department" htmlFor="u-dept">
          <input id="u-dept" className={inputClass} value={form.department} onChange={set('department')} />
        </Field>
      </form>
    </Modal>);

}