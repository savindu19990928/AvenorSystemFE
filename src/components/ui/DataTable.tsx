import React from 'react';
import { StateMessage } from './StateMessage';
import { cx } from '../../utils/styles';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  getRowKey: (row: T) => string | number;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  rowClassName?: (row: T) => string;
}

export function DataTable<T>({
  columns,
  rows,
  loading,
  error,
  onRetry,
  onRowClick,
  getRowKey,
  emptyTitle,
  emptyMessage,
  emptyAction,
  rowClassName
}: DataTableProps<T>) {
  if (loading && !rows) return <StateMessage kind="loading" />;
  if (error) return <StateMessage kind="error" message={error} onRetry={onRetry} />;
  if (!rows || rows.length === 0) {
    return <StateMessage kind="empty" title={emptyTitle} message={emptyMessage} action={emptyAction} />;
  }
  return (
    <div className={cx('overflow-x-auto', loading && 'opacity-60')}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line">
            {columns.map((c) =>
            <th
              key={c.key}
              scope="col"
              className={cx(
                'whitespace-nowrap px-4 py-2.5 text-xs font-medium text-faint',
                c.align === 'right' ? 'text-right' : 'text-left'
              )}>
              
                {c.header}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) =>
          <tr
            key={getRowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={
            onRowClick ?
            (e) => {
              if (e.key === 'Enter') onRowClick(row);
            } :
            undefined
            }
            tabIndex={onRowClick ? 0 : undefined}
            className={cx(
              'border-b border-line/70 last:border-0',
              onRowClick && 'cursor-pointer transition-colors duration-150 hover:bg-canvas focus-visible:bg-canvas focus-visible:outline-none',
              rowClassName?.(row)
            )}>
            
              {columns.map((c) =>
            <td
              key={c.key}
              className={cx('px-4 py-3 align-middle text-ink', c.align === 'right' && 'text-right tabular-nums', c.className)}>
              
                  {c.render(row)}
                </td>
            )}
            </tr>
          )}
        </tbody>
      </table>
    </div>);

}