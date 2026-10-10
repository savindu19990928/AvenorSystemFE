import React, { useState } from 'react';
import { AlertCircleIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { inputClass } from '../utils/styles';
import { API_BASE_URL, errorMessage } from '../utils/api';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid min-h-full w-full bg-canvas lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-bold">A</div>
          <span className="text-lg font-semibold">Avenor</span>
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">Every order, from inquiry to closure, in one record.</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Quotations, artwork approval, stock, production, delivery, invoicing and payments — all linked to the Order ID and kept separate by brand.
          </p>
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-white/10 pt-6 text-sm">
            <div>
              <dt className="font-medium text-[#e8c996]">Premium Brand</dt>
              <dd className="mt-1 text-white/55">High quality · 220 GSM</dd>
            </div>
            <div>
              <dt className="font-medium text-[#a9c2e3]">Standard Brand</dt>
              <dd className="mt-1 text-white/55">Low cost · 160 GSM</dd>
            </div>
          </dl>
        </div>
        <p className="text-xs text-white/40">Avenor Apparel (Pvt) Ltd · Internal staff only</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-muted">Use your staff account. Your role decides what you can see.</p>

          {error &&
            <div role="alert" className="mt-6 flex gap-2 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger">
              <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          }

          <div className="mt-6 space-y-4">
            <Field label="Username" htmlFor="username">
              <input id="username" autoComplete="username" required className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} />
            </Field>
            <Field label="Password" htmlFor="password">
              <input id="password" type="password" autoComplete="current-password" required className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
          </div>
          <Button type="submit" variant="primary" loading={pending} className="mt-6 w-full">
            Sign in
          </Button>
          <p className="mt-6 text-center text-xs text-faint">Connected to {API_BASE_URL.replace('https://', '')}</p>
        </form>
      </section>
    </div>);

}