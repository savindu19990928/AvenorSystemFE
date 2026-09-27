export const API_BASE_URL = 'https://admin.avenorapparel.lk';
export const SESSION_EXPIRED_EVENT = 'avenor:session-expired';

const ACCESS_KEY = 'avenor.access';
const REFRESH_KEY = 'avenor.refresh';

type QueryValue = string | number | boolean | null | undefined;
export type Query = Record<string, QueryValue>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Query;
  auth?: boolean;
}

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const tokenStore = {
  access: () => localStorage.getItem(ACCESS_KEY),
  refresh: () => localStorage.getItem(REFRESH_KEY),
  set(access: string, refresh?: string) {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
};

let refreshing: Promise<boolean> | null = null;

export async function apiRequest<T>(path: string, opts: RequestOptions = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  if (opts.body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  const token = tokenStore.access();
  if (opts.auth !== false && token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body === undefined ? undefined : isForm ? opts.body as FormData : JSON.stringify(opts.body)
    });
  } catch {
    throw new ApiError('Unable to reach the server. Check your connection and try again.', 0);
  }

  if (res.status === 401 && retry && opts.auth !== false && tokenStore.refresh()) {
    const ok = await refreshAccessToken();
    if (ok) return apiRequest<T>(path, opts, false);
    tokenStore.clear();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) throw toApiError(res.status, data);
  return data as T;
}

export const api = {
  get: <T,>(path: string, query?: Query) => apiRequest<T>(path, { query }),
  list: async <T,>(path: string, query?: Query) => asList<T>(await apiRequest<unknown>(path, { query })),
  post: <T,>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body }),
  patch: <T,>(path: string, body: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  del: <T,>(path: string) => apiRequest<T>(path, { method: 'DELETE' })
};

export function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as {results?: unknown;}).results)) {
    return (data as {results: T[];}).results;
  }
  return [];
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

export function fileUrl(path?: string | null): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(path.replace(/^\//, ''), `${API_BASE_URL}/`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const data = await apiRequest<{access: string;refresh?: string;}>(
          '/api/auth/token/refresh/',
          { method: 'POST', body: { refresh: tokenStore.refresh() }, auth: false },
          false
        );
        tokenStore.set(data.access, data.refresh);
        return true;
      } catch {
        return false;
      } finally {
        setTimeout(() => {
          refreshing = null;
        }, 0);
      }
    })();
  }
  return refreshing;
}

function toApiError(status: number, data: unknown): ApiError {
  const fallback: Record<number, string> = {
    400: 'The request could not be processed.',
    401: 'Your session has expired. Please sign in again.',
    403: 'Your role does not have permission for this action.',
    404: 'The requested record was not found.',
    500: 'The server ran into a problem. Please try again shortly.'
  };
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    if (typeof obj.error === 'string') return new ApiError(obj.error, status);
    if (typeof obj.detail === 'string') return new ApiError(obj.detail, status);
    const fieldErrors: Record<string, string> = {};
    Object.entries(obj).forEach(([key, value]) => {
      const msg = Array.isArray(value) ? value.map(String).join(' ') : typeof value === 'string' ? value : '';
      if (msg) fieldErrors[key] = msg;
    });
    const first = Object.entries(fieldErrors)[0];
    if (first) {
      const label = first[0] === 'non_field_errors' ? '' : `${first[0].replace(/_/g, ' ')}: `;
      return new ApiError(`${label}${first[1]}`, status, fieldErrors);
    }
  }
  return new ApiError(fallback[status] ?? `Request failed (${status}).`, status);
}