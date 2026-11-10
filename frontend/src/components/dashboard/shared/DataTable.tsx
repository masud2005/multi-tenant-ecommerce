'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  empty?: React.ReactNode;
  mobileCard?: (row: T) => React.ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  selectable,
  selected = [],
  onSelectedChange,
  empty,
  mobileCard
}: DataTableProps<T>) {
  const allIds = rows.map(rowKey);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.includes(id));

  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <>
      {mobileCard && (
        <ul className="divide-y divide-line md:hidden">
          {rows.map((r) => (
            <li
              key={rowKey(r)}
              onClick={() => onRowClick?.(r)}
              className={cn('px-4 py-3', onRowClick && 'cursor-pointer active:bg-canvas')}
            >
              {mobileCard(r)}
            </li>
          ))}
        </ul>
      )}
      <div className={cn('overflow-x-auto', mobileCard && 'hidden md:block')}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas/60 text-left text-xs text-ink-muted">
              {selectable && (
                <th className="w-10 px-4 py-2.5">
                  <Checkbox
                    checked={allSelected}
                    onChange={(v) => onSelectedChange?.(v ? allIds : [])}
                    ariaLabel="Select all"
                  />
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    'whitespace-nowrap px-4 py-2.5 font-medium',
                    c.align === 'right' && 'text-right',
                    c.align === 'center' && 'text-center',
                    c.hideOnMobile && 'hidden lg:table-cell',
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => {
              const id = rowKey(r);
              const isSel = selected.includes(id);
              return (
                <tr
                  key={id}
                  onClick={() => onRowClick?.(r)}
                  className={cn(
                    'transition-colors duration-100',
                    onRowClick && 'cursor-pointer hover:bg-canvas/70',
                    isSel && 'bg-clay-soft/40'
                  )}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSel}
                        onChange={(v) =>
                          onSelectedChange?.(v ? [...selected, id] : selected.filter((x) => x !== id))
                        }
                        ariaLabel="Select row"
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        'px-4 py-3 align-middle',
                        c.align === 'right' && 'text-right',
                        c.align === 'center' && 'text-center',
                        c.hideOnMobile && 'hidden lg:table-cell',
                        c.className
                      )}
                    >
                      {c.render(r)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
