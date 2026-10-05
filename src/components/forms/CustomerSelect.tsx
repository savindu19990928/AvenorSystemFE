import React from 'react';
import type { Customer } from '../../types/api';
import { api } from '../../utils/api';
import { useApi } from '../../hooks/useApi';
import { inputClass } from '../../utils/styles';

interface CustomerSelectProps {
  id?: string;
  value: number | null;
  onChange: (customer: Customer | null) => void;
  disabled?: boolean;
}

export function CustomerSelect({ id, value, onChange, disabled }: CustomerSelectProps) {
  const { data, loading, error } = useApi(() => api.list<Customer>('/api/customers/customers/'), []);
  return (
    <select
      id={id}
      className={inputClass}
      value={value ?? ''}
      disabled={disabled || loading}
      onChange={(e) => onChange(data?.find((c) => c.id === Number(e.target.value)) ?? null)}>
      
      <option value="">{loading ? 'Loading customers…' : error ? 'Could not load customers' : 'Select a customer'}</option>
      {data?.map((c) =>
      <option key={c.id} value={c.id}>
          {c.company_name ? `${c.company_name} — ${c.contact_person}` : c.contact_person}
        </option>
      )}
    </select>);

}