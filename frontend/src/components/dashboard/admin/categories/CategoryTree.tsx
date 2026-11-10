'use client';

import React from 'react';
import { ChevronDown, ChevronRight, Folder, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Panel } from '@/components/dashboard/shared/Panel';
import type { CategoryItemData } from '@/types/commerce';

interface CategoryTreeProps {
  categories: CategoryItemData[];
  activeKey: string;
  onSelectCategory: (key: string) => void;
  openKeys: string[];
  onToggleKey: (key: string) => void;
  getProductCount: (categoryKey: string, subcategory?: string) => number;
  className?: string;
  activeSubcategory?: string | null;
  onSelectSubcategory?: (categoryKey: string, subcategory: string | null) => void;
}

export function CategoryTree({
  categories,
  activeKey,
  onSelectCategory,
  openKeys,
  onToggleKey,
  getProductCount,
  className,
  activeSubcategory,
  onSelectSubcategory,
}: CategoryTreeProps) {
  return (
    <Panel
      title="Category tree"
      description="Click a category or subcategory to manage"
      flush
      className={cn('h-full min-h-[480px] flex flex-col', className)}
      bodyClassName="flex-1"
    >
      <ul className="py-2" role="tree">
        {categories.map((c) => {
          const expanded = openKeys.includes(c.key);
          const isCategorySelected = activeKey === c.key && !activeSubcategory;

          return (
            <li key={c.key} role="treeitem" aria-expanded={expanded}>
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm transition-colors rounded-md mx-1.5',
                  isCategorySelected
                    ? 'bg-canvas font-semibold text-ink shadow-xs'
                    : activeKey === c.key
                    ? 'bg-subtle/50 text-ink'
                    : 'hover:bg-subtle/70 text-ink'
                )}
              >
                <button
                  type="button"
                  onClick={() => onToggleKey(c.key)}
                  aria-label={expanded ? `Collapse ${c.name}` : `Expand ${c.name}`}
                  className="rounded p-0.5 text-ink-muted hover:bg-subtle hover:text-ink transition-colors cursor-pointer shrink-0"
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory(c.key);
                    onSelectSubcategory?.(c.key, null);
                  }}
                  className="flex-1 flex items-center gap-2 text-left font-medium cursor-pointer truncate"
                >
                  <Folder className="h-4 w-4 text-ink-muted shrink-0" />
                  <span className="truncate">{c.name}</span>
                </button>

                <span className="text-xs text-ink-muted tabular-nums shrink-0 font-medium">
                  {getProductCount(c.key)}
                </span>
              </div>

              {expanded && c.subcategories.length > 0 && (
                <ul role="group" className="space-y-0.5 my-0.5 pl-6">
                  {c.subcategories.map((sub) => {
                    const isSubSelected = activeKey === c.key && activeSubcategory === sub;

                    return (
                      <li key={sub} role="treeitem">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCategory(c.key);
                            onSelectSubcategory?.(c.key, sub);
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 py-1.5 pl-3 pr-3 text-sm rounded-md transition-colors cursor-pointer text-left',
                            isSubSelected
                              ? 'bg-canvas font-semibold text-ink shadow-xs border-l-2 border-clay'
                              : 'text-ink-soft hover:text-ink hover:bg-subtle/40'
                          )}
                        >
                          <Tag className="h-3.5 w-3.5 text-ink-muted shrink-0" />
                          <span className="flex-1 truncate">{sub}</span>
                          <span className="text-xs text-ink-muted tabular-nums shrink-0">
                            {getProductCount(c.key, sub)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
