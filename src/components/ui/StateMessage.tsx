import React from 'react';
import { AlertTriangleIcon, InboxIcon, Loader2Icon } from 'lucide-react';
import { Button } from './Button';

interface StateMessageProps {
  kind: 'loading' | 'error' | 'empty';
  title?: string;
  message?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
}

export function StateMessage({ kind, title, message, onRetry, action }: StateMessageProps) {
  if (kind === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted" role="status">
        <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" />
        {title ?? 'Loading…'}
      </div>);

  }
  const Icon = kind === 'error' ? AlertTriangleIcon : InboxIcon;
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <Icon className={kind === 'error' ? 'h-6 w-6 text-danger' : 'h-6 w-6 text-faint'} aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-ink">{title ?? (kind === 'error' ? 'Could not load data' : 'Nothing here yet')}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
      <div className="mt-4 flex gap-2">
        {onRetry &&
        <Button size="sm" onClick={onRetry}>
            Try again
          </Button>
        }
        {action}
      </div>
    </div>);

}